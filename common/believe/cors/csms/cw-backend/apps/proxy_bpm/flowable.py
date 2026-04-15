import json
from django.db import connections
from utils.loggerwrapper import Logger

logger = Logger(__name__)

def get_tasks(task_name, process_key, assignee, groups, start, size, order, sort, tenant, filter_body, includeProcessVariable, completed=False):
    if assignee is None and groups is not None and len(groups) == 0:
        flowable_result = {
            "data": [],
            "total": 0,
            "start": start,
            "sort": sort,
            "order": order,
            "size": 0
        }
        return flowable_result
    sorting = sort
    tmp_or_cond = {}

    # Determine the correct table and field names based on completion status
    if completed:
        end_time_ = "T.end_time_ AS EndTime,"
        var_table = "act_hi_varinst"
        task_table = "act_hi_taskinst"
        create_time = "start_time_"
        completed_condition = " AND T.end_time_ IS NOT NULL AND delete_reason_ is null"
    else:
        end_time_ = ""
        var_table = "act_ru_variable"
        task_table = "act_ru_task"
        create_time = "create_time_"
        completed_condition = ""

    # Process variable filter
    filter_conditions = []
    if filter_body:
        tmp_or_cond = {}
        for item in filter_body:
            if item["variableOperation"] in ["EQUALS", "NOT_EQUALS", "LIKE", "LIKE_IGNORE_CASE"]:
                operator = {
                    "EQUALS": "=",
                    "NOT_EQUALS": "!=",
                    "LIKE": "LIKE",
                    "LIKE_IGNORE_CASE": "ILIKE"
                }[item["variableOperation"]]
                filter_conditions.append(f"(V1.name_ = '{item['name']}' AND V1.text_ {operator} '{item['value']}')")
            elif item["variableOperation"] == "IN":
                tmp_or_cond.setdefault(item["name"], []).append(item["value"])
            elif item["variableOperation"] == "LIST":
                filter_conditions.append(f"(V1.name_ = '{item['name']}' AND text_::jsonb ?| ARRAY{item['value']})")
        for name, values in tmp_or_cond.items():
            values = tuple(values) if len(tuple(values)) > 1 else f"('{tuple(values)[0]}')"
            filter_conditions.append(f"(V1.name_ = '{name}' AND V1.text_ IN {values})")

    if filter_conditions:
        filter_clause = "".join(
            f" AND EXISTS (SELECT 1 FROM {var_table} V1 WHERE V1.proc_inst_id_ = T.proc_inst_id_ AND {condition})"
            for condition in filter_conditions
        )
    else:
        filter_clause = ""

    # Sorting logic
    sort_columns = {
        "createTime": "create_time_",
        "dueDate": "due_date_",
        "name_": "T.name_"
    }
    if completed:
        sort_columns["createTime"] = "start_time_"
    sort_column = sort_columns.get(sort, f"MAX(CASE WHEN V.name_ = '{sort}' THEN COALESCE(V.text_, V.long_::TEXT, V.double_::TEXT) END)")
    sort_in_select_condition = "" if sort in sort_columns else f", {sort_column}"
    grp_by_task = "" if sort in sort_columns else " GROUP BY T.id_"

    # Assignee
    if assignee:
        assignee_condition = f"AND T.assignee_ = '{assignee}'"
    else:
        if groups and len(groups) > 0:
            groups = tuple(groups) if len(tuple(groups)) > 1 else f"('{tuple(groups)[0]}')"
            assignee_condition = f"AND T.assignee_ IS NULL AND il.group_id_ IN {groups}"      
        else:
            assignee_condition = ""

    # Process Key
    process_table_join = ""
    if process_key:
        process_table_join = f"""
        JOIN act_re_procdef R ON T.proc_def_id_ = R.id_ 
        AND R.key_ = '{process_key}' 
        AND R.tenant_id_ = '{tenant}'
        """

    # Task Name
    name_condition = f"AND T.name_ = '{task_name}'" if task_name else ""

    # Total count query
    total_query = f"""
        SELECT COUNT(DISTINCT T.id_ )
        FROM {task_table} T
        {process_table_join}
        LEFT JOIN act_ru_identitylink il ON il.task_id_ = T.id_ AND il.type_ = 'candidate'
        WHERE T.tenant_id_ = '{tenant}'
        {assignee_condition}
        {name_condition}
        {completed_condition}
        {filter_clause};
        """

    # Base query construction
    # If process_table_join is present, don't add tenant filter in WHERE (it's already in the JOIN)
    tenant_condition = "" if process_table_join else f"AND T.tenant_id_ = '{tenant}'"

    base_query = f'''
        SELECT DISTINCT T.id_ AS TaskId,
        T.name_ AS TaskName, 
        T.proc_def_id_ AS ProcessDefinitionId, 
        T.proc_inst_id_ AS ProcessInstanceId, 
        T.assignee_ AS Assignee, 
        T.{create_time} AS CreateTime,
        {end_time_}
        T.claim_time_ AS ClaimTime,
        T.category_ AS Category,
        T.form_key_ AS FormKey,
        T.due_date_ AS DueDate
        {sort_in_select_condition}
        FROM {task_table} T
        {process_table_join}
        LEFT JOIN {var_table} V 
        ON T.proc_inst_id_ = V.proc_inst_id_
        LEFT JOIN act_ru_identitylink il ON il.task_id_ = T.id_ AND il.type_ = 'candidate'
        WHERE 1=1
        {tenant_condition}
        {assignee_condition}
        {name_condition}
        {completed_condition}
        {filter_clause}
        {grp_by_task}
    '''

    # Execute the query with pagination
    with connections['flowable'].cursor() as cursor:
        data_query = f"{base_query} ORDER BY {sort_column} {order} OFFSET {start} LIMIT {size}"
        total_query = f"{total_query}"
        logger.info(data_query)
        result = []
        if int(size) > 0:
            cursor.execute(data_query)
            rows = cursor.fetchall()

            # Execute Process Var query
            process_list = {}
            if includeProcessVariable:
                process_instance_ids = [row[3] for row in rows]
                if process_instance_ids:
                    process_tuple = tuple(process_instance_ids)
                    include_process_variable = f"""
                    V.name_ AS variableName,
                    COALESCE(V.text_, V.long_::TEXT, V.double_::TEXT) AS variableValue,
                    V.{'type_' if var_table == 'act_ru_variable' else 'var_type_'} AS variableType,
                    V.proc_inst_id_ AS processId
                    """
                    process_var_query = f"""
                    SELECT {include_process_variable}
                    FROM {var_table} V
                    WHERE proc_inst_id_ IN {process_tuple if len(process_tuple) > 1 else f"('{process_tuple[0]}')"};
                    """
                    cursor.execute(process_var_query)
                    process_var_rows = cursor.fetchall()
                    for row in process_var_rows:
                        row_value = row[1]
                        row_type = row[2]
                        if row_type == "integer":
                            row_value = int(row_value)
                        elif row_type == "json":
                            try:
                                row_value = json.loads(row_value)
                            except:
                                pass
                        elif row_type == "boolean":
                            row_value = bool(row_value)
                        else:
                            pass
                        process_list.setdefault(row[3], []).append({
                            "name": row[0],
                            "value": row_value,
                            "type": row_type,
                        })

            result = [
                {
                    "id": row[0],
                    "url": "",
                    "owner": None,
                    "assignee": row[4],
                    "delegationState": None,
                    "name": row[1],
                    "description": None,
                    "createTime": row[5],
                    "dueDate": row[10] if completed else row[9],
                    "endTime": row[6] if completed else None,
                    "priority": None,
                    "suspended": False,
                    "claimTime": row[7] if completed else row[6],
                    "taskDefinitionKey": None,
                    "scopeDefinitionId": None,
                    "scopeId": None,
                    "subScopeId": None,
                    "scopeType": None,
                    "propagatedStageInstanceId": None,
                    "tenantId": tenant,
                    "category": row[8] if completed else row[7],
                    "formKey": row[9] if completed else row[8],
                    "parentTaskId": None,
                    "parentTaskUrl": None,
                    "executionId": None,
                    "executionUrl": "",
                    "processInstanceId": row[3],
                    "processInstanceUrl": "",
                    "processDefinitionId": row[2],
                    "processDefinitionUrl": "",
                    "variables": process_list.get(row[3], [])
                }
                for row in rows
            ]

        # Fetch total count
        cursor.execute(total_query)
        total_count = cursor.fetchone()[0]

    flowable_result = {
        "data": result,
        "total": total_count,
        "start": start,
        "sort": sorting,
        "order": order,
        "size": len(result)
    }
    return flowable_result

def get_process_by_process_ids(process_name, tenant):
    with connections['flowable'].cursor() as cursor:
        base_query = f'''
        SELECT DISTINCT P.id_ AS ProcessInstanceId, 
            P.name_ AS ProcessName,  
            P.proc_def_id_ AS ProcessDefinitionId,  
            P.start_time_ AS CreateTime, 
            P.end_time_ AS EndTime
        FROM 
            act_hi_procinst P
        WHERE 
            P.name_ = '{process_name}'
            AND P.tenant_id_ = '{tenant}'
            AND P.end_time_ IS NULL
        ORDER BY 
            P.start_time_ DESC;
        '''
        print(base_query)
        cursor.execute(base_query)
        rows = cursor.fetchall()
        result = [
            {
                "id": row[0],
                "name": row[1],
                "createTime": row[3],
                "endTime": row[4],
                "processDefinitionId": row[2],
            }
            for row in rows
        ]
    return result

def get_tasks_by_process_ids(process_name, tenant):
    # if len(process_ids) > 0:
    #     process_ids = tuple(process_ids) if len(tuple(process_ids)) > 1 else f"('{tuple(process_ids)[0]}')"
    
    with connections['flowable'].cursor() as cursor:
        base_query = f'''
        SELECT DISTINCT T.id_ AS TaskId, 
            T.name_ AS TaskName,  
            T.proc_def_id_ AS ProcessDefinitionId,  
            T.proc_inst_id_ AS ProcessInstanceId,  
            T.assignee_ AS Assignee,  
            T.start_time_ AS CreateTime, 
            T.end_time_ AS EndTime, 
            T.claim_time_ AS ClaimTime, 
            il.group_id_ AS GroupId, 
            PD.key_ AS ProcessKey 
        FROM 
            act_hi_procinst P
        JOIN 
            act_hi_taskinst T ON T.proc_inst_id_ = P.id_
        LEFT JOIN 
            act_ru_identitylink il ON il.task_id_ = T.id_ AND il.type_ = 'candidate'
        JOIN 
            act_re_procdef PD ON P.proc_def_id_ = PD.id_
        WHERE 
            P.name_ ILIKE '{process_name}%'
            AND P.tenant_id_ = '{tenant}'
        ORDER BY 
            T.start_time_ DESC;
        '''
        print(base_query)
        cursor.execute(base_query)
        rows = cursor.fetchall()
        result = [
            {
                "id": row[0],
                "assignee": row[4],
                "name": row[1],
                "createTime": row[5],
                "endTime": row[6],
                "claimTime": row[7],
                "processInstanceId": row[3],
                "processDefinitionId": row[2],
                "group": row[8],
                "processKey": row[9]
            }
            for row in rows
        ]
    return result

def get_process(process_key, deleted, finished, start, size, order, sort, tenant, filter_body, includeProcessVariable):
    # Determine the status condition and variable table
    if deleted:
        status_condition = "AND P.delete_reason_ IS NOT NULL"
        var_table = "act_hi_varinst"
    elif finished:
        status_condition = "AND P.end_time_ IS NOT NULL AND P.delete_reason_ IS NULL"
        var_table = "act_hi_varinst"
    else:
        status_condition = "AND P.end_time_ IS NULL"
        var_table = "act_ru_variable"

    # Process variable filter
    filter_conditions = []
    if filter_body:
        tmp_or_cond = {}
        for item in filter_body:
            if item["variableOperation"] in ["EQUALS", "NOT_EQUALS", "LIKE", "LIKE_IGNORE_CASE"]:
                operator = {
                    "EQUALS": "=",
                    "NOT_EQUALS": "!=",
                    "LIKE": "LIKE",
                    "LIKE_IGNORE_CASE": "ILIKE"
                }[item["variableOperation"]]
                filter_conditions.append(f"(V1.name_ = '{item['name']}' AND V1.text_ {operator} '{item['value']}')")
            elif item["variableOperation"] == "IN":
                tmp_or_cond.setdefault(item["name"], []).append(item["value"])
            elif item["variableOperation"] == "LIST":
                filter_conditions.append(f"(V1.name_ = '{item['name']}' AND text_::jsonb ?| ARRAY{item['value']})")
        for name, values in tmp_or_cond.items():
            values = tuple(values) if len(tuple(values)) > 1 else f"('{tuple(values)[0]}')"
            filter_conditions.append(f"(V1.name_ = '{name}' AND V1.text_ IN {values})")

    if filter_conditions:
        filter_clause = "".join(
            f" AND EXISTS (SELECT 1 FROM {var_table} V1 WHERE V1.proc_inst_id_ = P.proc_inst_id_ AND {condition})"
            for condition in filter_conditions
        )
    else:
        filter_clause = ""

    # Process name filter
    #process_name_condition = f"AND P.name_ ILIKE '{process_name}%'" if process_name else ""

    # Sorting
    var_table_join = ""
    sort_select = ""
    if sort in ["startTime", "endTime"]:
        sort_column = {"startTime": "P.start_time_", "endTime": "P.end_time_"}[sort]
    else:
        sort_column = f"MAX(CASE WHEN V.name_ = '{sort}' THEN COALESCE(V.text_, V.long_::TEXT, V.double_::TEXT) END)"
        sort_select = f", {sort_column} AS sort_value"
        var_table_join = f"LEFT JOIN {var_table} V ON P.proc_inst_id_ = V.proc_inst_id_"

    # Process key condition
    process_table_join = ""
    if process_key:
        process_table_join = f"""
        JOIN act_re_procdef R ON P.proc_def_id_ = R.id_
        AND R.key_ = '{process_key}'
        AND R.tenant_id_ = '{tenant}'
        """

    with connections['flowable'].cursor() as cursor:
        # Total count query
        total_query = f"""
        SELECT COUNT(DISTINCT P.id_)
        FROM act_hi_procinst P
        {process_table_join}
        WHERE P.tenant_id_ = '{tenant}'
        {status_condition}
        {filter_clause};
        """

        # Data query
        data_query = f"""
        SELECT DISTINCT P.id_ AS processId,
               P.name_ AS processName,
               P.proc_def_id_ AS processDefinitionId,
               P.start_time_ AS startTime,
               P.end_time_ AS endTime,
               P.duration_ AS duration,
               P.delete_reason_ AS deleteReason
               {sort_select}
        FROM act_hi_procinst P
        {process_table_join}
        {var_table_join}
        WHERE P.tenant_id_ = '{tenant}'
        {status_condition}
        {filter_clause}
        group by P.id_
        ORDER BY {sort_column} {order}
        OFFSET {start} LIMIT {size};
        """
        logger.info(data_query)

        # Execute data query
        cursor.execute(data_query)
        rows = cursor.fetchall()

        # Execute Process Var query
        process_list = {}
        if includeProcessVariable:
            process_instance_ids = [row[0] for row in rows]
            if process_instance_ids:
                process_tuple = tuple(process_instance_ids)
                include_process_variable = f"""
                V.name_ AS variableName,
                COALESCE(V.text_, V.long_::TEXT, V.double_::TEXT) AS variableValue,
                V.{'type_' if var_table == 'act_ru_variable' else 'var_type_'} AS variableType,
                V.proc_inst_id_ AS processId
                """
                process_var_query = f"""
                SELECT {include_process_variable}
                FROM {var_table} V
                WHERE proc_inst_id_ IN {process_tuple if len(process_tuple) > 1 else f"('{process_tuple[0]}')"};
                """
                cursor.execute(process_var_query)
                process_var_rows = cursor.fetchall()
                for row in process_var_rows:
                    row_value = row[1]
                    row_type = row[2]
                    if row_type == "integer":
                        row_value = int(row_value)
                    elif row_type == "json":
                        try:
                            row_value = json.loads(row_value)
                        except:
                            pass
                    elif row_type == "boolean":
                        row_value = bool(row_value)
                    else:
                        pass
                    process_list.setdefault(row[3], []).append({
                        "name": row[0],
                        "value": row_value,
                        "type": row_type,
                    })

        # Process the result rows
        process_instances = []
        for row in rows:
            process_id = row[0]
            process_data = {
                "id": process_id,
                "name": row[1],
                "processDefinitionId": row[2],
                "startTime": row[3],
                "endTime": row[4],
                "durationInMillis": row[5],
                "deleteReason": row[6],
                "variables": process_list.get(process_id, [])
            }
            process_instances.append(process_data)

        # Total count query
        cursor.execute(total_query)
        total_count = cursor.fetchone()[0]

    # Final result structure
    flowable_result = {
        "data": process_instances,
        "total": total_count,
        "start": start,
        "sort": sort,
        "order": order,
        "size": len(process_instances)
    }
    return flowable_result

def get_var_by_process_id(process_id):
    # This function retrieves process variables by process ID
    with connections['flowable'].cursor() as cursor:
        base_query = f"""
        SELECT V.name_ AS variableName, COALESCE(V.text_, V.long_::TEXT, V.double_::TEXT) AS variableValue
        FROM act_ru_variable V
        WHERE V.proc_inst_id_ = '{process_id}';
        """
        print(base_query)
        cursor.execute(base_query)
        rows = cursor.fetchall()
        result = {}
        for row in rows:
            result[row[0]] = row[1]
    return result

def get_process_id(process_key=None, start=0, size=10000, tenant=None, from_date=None, to_date=None, count=False):
    # Process key condition
    process_table_join = ""
    if process_key:
        process_table_join = f"""
        JOIN act_re_procdef R ON P.proc_def_id_ = R.id_
        AND R.key_ = '{process_key}'
        AND R.tenant_id_ = '{tenant}'
        """
    
    # Tenant Condition
    tenant_condition = ""
    if tenant:
        tenant_condition = f"AND P.tenant_id_ = '{tenant}'"

    # Duration Condition
    duration_condition = ""
    if from_date and to_date:
        duration_condition += f"AND P.end_time_ BETWEEN '{from_date}' AND '{to_date}'"
    elif to_date:
        duration_condition += f"AND P.end_time_ <= '{to_date}'"
    else:
        pass

    with connections['flowable'].cursor() as cursor:
        # Data query
        data_query = f"""
        SELECT P.id_ AS processId
        FROM act_hi_procinst P
        {process_table_join}
        WHERE P.end_time_ IS NOT NULL
        {tenant_condition}
        {duration_condition}
        order by P.end_time_ ASC
        OFFSET {start} LIMIT {size};
        """
        if count:
            # Total count query
            total_query = f"""
            SELECT count(P.id_) AS processId
            FROM act_hi_procinst P
            {process_table_join}
            WHERE P.end_time_ IS NOT NULL
            {tenant_condition}
            {duration_condition};
            """
            # Execute data query
            logger.info(total_query)
            cursor.execute(total_query)
            flowable_result = cursor.fetchone()[0]
        else:
            # Execute Total count query
            logger.info(data_query)
            cursor.execute(data_query)
            rows = cursor.fetchall()
            flowable_result = rows
            flowable_result = list(sum(flowable_result, ()))
    return flowable_result
