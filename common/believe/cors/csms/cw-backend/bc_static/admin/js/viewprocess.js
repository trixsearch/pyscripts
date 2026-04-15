var $ = django.jQuery;

const ProcessType = {
  ONGOING: 'ongoing',
  WITHDRAWN: 'withdrawn',
  COMPLETED: 'completed'
}

const pageSize = 50;

let ongoing_process_start = 0;
let withdrawn_process_start = 0;
let completed_process_start = 0;

let ongoing_process_data = [];
let withdrawn_process_data = [];
let completed_process_data = [];

let ongoing_process_total = 0;
let withdrawn_process_total = 0;
let completed_process_total = 0;

let processkey = '';
let tenant_id = '';

let ongoing_process_url ='';
let withdrawn_process_url ='';
let completed_process_url = '';

let PROCESS_URL = `/cw/${tenant_id}/apps/process-instances`;


let doSearch = false;
let searchText = '';

$(document).ready(function() {
    $(".view-process").click(function(e) {
      processkey = $(this).data('processkey');
      tenant_id = $(this).data('tenant');
      PROCESS_URL = `/cw/${tenant_id}/apps/process-instances`;

      const body = `
        <div>
          <div id="ongoingprocesscount" style = "display:inline-block; margin-right:10px; color:#447e9b"><h2>ONGOING PROCESS: ${ongoing_process_total}</h2></div>
          <div id="withdrawnprocesscount" style = "display:inline-block; margin-right:10px;color:#447e9b"><h2>WITHDRAWN PROCESS: ${ongoing_process_total}</h2></div>
          <div id="completedprocesscount" style = "display:inline-block;color:#447e9b"><h2>COMPLETED PROCESS: ${ongoing_process_total}</h2></div>
          <br><input placeholder="name, email or phone" type="text" class="vTextField" id="searchText" />&nbsp;&nbsp;<button class=" button" id='searchButton' >SEARCH</button>
          <button id='clearSearchButton' class=" button" >CLEAR SEARCH</button>
          <button id='processDeleteButton' class=" button" >DELETE SELECTED</button>
        </div>
        <br><h1>ONGOING PROCESS:</h1>
        <div id="ongoingprocess">No Process</div>
        <br><h1>WITHDRAWN PROCESS:</h1>
        <div id="withdrawnprocess">No Process</div>
        <br><h1>COMPLETED PROCESS:</h1>
        <div id="completedprocess">No Process</div>
        <hr><br><br>
        <br><h1>Selected Process Details:</h1>
        <div id="processTogglerDiv"></div>
        <div id="processdetails">Select a process.</div>
      </div>
          `
      $('#content').html(body);
      $('#searchButton').click(function(e){
        const text = document.getElementById("searchText").value;
        if(text) {
          doSearch = true;
          if(text.includes('@')) {
            searchText = {"name":"entity_email","value":`%${text}%`}
          }else if (isNaN(text)) {
            searchText = {"name":"entity_name","value":`%${text}%`}
          }
          else{
            searchText = {"name":"entity_phone_number","value":`%${text}%`}
          }
        }else{
          doSearch = false;
          searchText = '';
        }
        fetch_ongoing_process();
        fetch_completed_process();
        fetch_withdrawn_process();  
      });

      $('#processDeleteButton').click(function(e){
        $('.processSelector:checkbox:checked').each(function(){
          try{
            handleDelete(this.id.split("radio-")[1], false);
          }catch(e) {
            console.log(e);
          }
        });
      });

      $('#clearSearchButton').click(function(e){
        doSearch = false;
        searchText = '';
        document.getElementById("searchText").value = "";
        fetch_ongoing_process();
        fetch_completed_process();
        fetch_withdrawn_process();  
      });
      
      fetch_ongoing_process();
      fetch_completed_process();
      fetch_withdrawn_process();     
    });
})

let can_fetch_ongoing = true;
function fetch_ongoing_process() {
  if(can_fetch_ongoing){
    can_fetch_ongoing =  false;
    let params = {
      deleted: false,
      finished: false,
      includeProcessVariables: true,
      order: "desc",
      processDefinitionKey: processkey,
      size: pageSize,
      sort: "endTime",
      start: ongoing_process_start
    };
    if (doSearch) {
      params.search = searchText
    }
    fetch(PROCESS_URL,{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    }).then(response => response.json())
      .then(res => {
          ongoing_process_data = res.data.data;
          ongoing_process_total = res.data.total;
          changeData(ongoing_process_data,ongoing_process_total, ProcessType.ONGOING)
          can_fetch_ongoing = true;            
      });
    }
}

let can_fetch_completed = true;
function fetch_completed_process() {
  if(can_fetch_completed){
    can_fetch_completed = false;
    let params = {
      deleted: false,
      finished: true,
      includeProcessVariables: true,
      order: "desc",
      processDefinitionKey: processkey,
      size: pageSize,
      sort: "endTime",
      start: completed_process_start
    };
    if (doSearch) {
      params.search = searchText
    }

    fetch(PROCESS_URL,{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(res => {
        completed_process_data = res.data.data;
        completed_process_total = res.data.total;
        changeData(completed_process_data, completed_process_total, ProcessType.COMPLETED)
        can_fetch_completed = true;
    });
  }
}

let can_fetch_withdrawn = true;
function fetch_withdrawn_process() {
  if(can_fetch_withdrawn){
    can_fetch_withdrawn = false; 
    let params = {
      deleted: true,
      finished: true,
      includeProcessVariables: true,
      order: "desc",
      processDefinitionKey: processkey,
      size: pageSize,
      sort: "endTime",
      start: withdrawn_process_start
    };
    if (doSearch) {
      params.search = searchText
    }
    fetch(PROCESS_URL,{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(res => {                
        withdrawn_process_data = res.data.data;
        withdrawn_process_total = res.data.total;
        changeData(withdrawn_process_data, withdrawn_process_total, ProcessType.WITHDRAWN)
        can_fetch_withdrawn = true;
    });
  }
}


function changeData(data, total, type){
  let ongoingbody = `<h2>ONGOING PROCESS: ${total}</h2>`
  let withdrawnbody = `<h2>WITHDRAWN PROCESS: ${total}</h2>`
  let completedbody = `<h2>COMPLETED PROCESS: ${total}</h2>`
  let tableBody = ''
  let tableHead = `
    <div class=”results”><table><thead><tr><th><input type="checkbox" class="processSelector" id=${type} /></th><th><divclass=”text”>Instance ID</div></th><th><divclass=”text”>Mobile</div></th><th>
    <divclass=”text”>Name</div></th><th><divclass=”text”>Email</div></th><th><divclass=text>Action</div></th></tr></thead><tbody>`

  data.forEach((data)=>{
      let phone = data.variables.find((data)=>{        
        return data.name == 'entity_phone_number'
      })
      if(phone && 'value' in phone){
        phone=phone.value
      }
      let email = data.variables.find((data)=>{        
        return data.name == 'entity_email'
      })
      if(email && 'value' in email){
        email=email.value
      }
      let firstName = data.variables.find((data)=>{        
        return data.name == 'entity_name'
      })
      if(firstName && 'value' in firstName){
        firstName=firstName.value
      }
      tableBody+=`
                  <tr class=${data.id+'tr'}>
                      <td><input type="checkbox" name=${"name-"+type} class="processSelector" id=${"radio-" + data.id} /></td>
                      <td><a class=${data.id} href='#processdetails'> ${data.id} </a></td>
                      <td>${phone || '-'}</td>
                      <td>${firstName || '-'}</td>
                      <td>${email || '-'}</td>
                      <td><button id="${data.id}" type="submit" class=" button">Delete</button></td>
                  </tr>
              `
      })

    let table = tableHead + tableBody +'</tbody></table></div>'
    let pageination =''
    if(type == ProcessType.ONGOING){
      $('#ongoingprocesscount').html(ongoingbody);
      pageination = table + getButtons(ongoing_process_data);
      $('#ongoingprocess').html(pageination);
    }
    if(type == ProcessType.WITHDRAWN){
      $('#withdrawnprocesscount').html(withdrawnbody);
      pageination = table + getButtons(withdrawn_process_data);
      $('#withdrawnprocess').html(pageination);
    }
    if(type == ProcessType.COMPLETED){
      $('#completedprocesscount').html(completedbody);
      pageination = table + getButtons(completed_process_data);
      $('#completedprocess').html(pageination);
    }

    $('.paginationControl').click(function(e){
      let name = $(this).data('name')
      let value = $(this).text();
      value = value.split('-')[0]
      getPaginationData(name, value);      
    });

    $(`#${type}`).click(function(e){
      if(this.checked){
        $(`input[name="name-${type}`).each(function(index, obj){
          obj.checked = true;
        });  
      }else{
        $(`input[name="name-${type}`).each(function(index, obj){
          obj.checked = false;
        });
      }      
    });

    for(let i=0; i<data.length;i++){      
      let processid = `${data[i].id}`
      $('#'+processid).click(function(e){
        var id = $(this).attr('id');
        handleDelete(id, true)
      })
      $('.'+processid).click(function(e){
        var cl = $(this).attr('class');
        viewData(cl);
      })
    }
}


function handleDelete(id, showAlert){
  if(!showAlert){
    $('#processDeleteButton').html('DELETING.....please wait!')
  }
  let is_ongoing_process = ongoing_process_data.filter((data)=>data.id == id)
  let url = '';
  if(is_ongoing_process.length > 0){
    url = `/cw/${tenant_id}/proxy-bpm/process-instances/delete/${id}?deleteReason=deleted by admin`
  }else {
    url = `/cw/${tenant_id}/proxy-bpm/history/historic-process-instance/${id}/delete`
  }

  $.ajax({
    type: "DELETE",
    url: url,
    success: function(msg){
      if(showAlert){
        alert("Process instance Deleted: " + id);
      }else{
        $('#processDeleteButton').html('DELETE SELECTED')
      }
        $('.'+`${id}`+'tr').remove();
    }
}).then(()=>{
  fetch_ongoing_process();
  fetch_completed_process();
  fetch_withdrawn_process();
  })  
}


function viewData(id){
  let all_process = ongoing_process_data.concat(withdrawn_process_data, completed_process_data)
  let process = all_process.find((p)=>{
    return p.id == id
  })
  $('#processTogglerDiv').html('<button id="processDetailsToggler" class="button">Hide Process Details </button>')

  $('#processDetailsToggler').click(function(){
    $('#processdetails').toggle()
  })

  let processData = ''
  Object.keys(process).forEach(function(key){
    if(process[key] && typeof(process[key])=='object'){
      let obj = process[key]
      obj.forEach(function(arrData){
        processData+=`<b>${arrData.name}</b>: ${arrData.value ||'NA'} <br>`
      })
      }else{
        processData+=`<b>${key}</b>: ${process[key]||'NA'} <br>`
      }
    });
  $('#processdetails').html(processData);
}


function getButtons(data){
  let len = 0;
  let name = ''
  if(data == ongoing_process_data){
    name = 'ongoing';
    len = ongoing_process_total;
  }else if(data == withdrawn_process_data){
    name = 'withdrawn';
    len = withdrawn_process_total;
  }else if(data == completed_process_data){
    name = 'completed'
    len = completed_process_total;
  }

  let buttons = '';
  for(let i=0; i<len; i+=pageSize) {
    let pageNo = i / pageSize;
    buttons += `<button class='paginationControl button' data-name=${name} >${pageNo + 1}</button>&nbsp;`;
  }
  return buttons;
}


function getPaginationData(name, value) {
  let start = parseInt(value) -1;
  start = start * pageSize;
  if(name === 'ongoing') {
    ongoing_process_start = start;
    fetch_ongoing_process();
  }else if(name == 'withdrawn') {
    withdrawn_process_start = start;
    fetch_withdrawn_process();
  }else if(name == 'completed') {
    completed_process_start = start;
    fetch_completed_process();
  }
}