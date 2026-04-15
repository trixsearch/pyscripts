from apps.org_jobs.models import HiringPartner, Partner


Jobs_filter_fields = ["job_id", "job_title", "jobType", "created_at", "description", "role__name", "work_city", "status", "target_date_to_finish_hiring", "expire_at_target_date", "IsResumeRequired", "MaxSalary", "MinSalary", "vendor_work_location__vendor__id", "vendor_work_location__vendor__name", "stage__name", "workStartTime", "workEndTime", "vendor_work_location__work_location__name"]
JobsRole_filter_fields = ["name", "description", "default_role__name"]
HiringEvent_filter_fields = ["description","last_date_to_apply", "event_start_date", "event_end_date", "reporting_date", "reporting_time", "interview_location", "event_id", "title"]
Partner_filter_fields = ["name", "partner_type", "short_name", "address", "cin", "pan", "gstn", "active", "created_at"]
HiringPartner_filter_fields = Partner_filter_fields + ["partner_subtype"]
JobCandidate_filter_fields = ["candidateId", "hiring_event__event_id", "hiring_event__title","hiring_event__description", "hiring_event__last_date_to_apply", "hiring_event__event_start_date", "hiring_event__event_end_date", "hiring_event__reporting_date", "hiring_event__reporting_time", "hiring_event__interview_location", "sourcing_partner__name", "sourcing_partner__id", "candidate__entity_name", "candidate__entity_phone_number", "candidate__work_location", "state__name", "created_at", "source"]
HeadCountPlan_filter_fields = ["role__name", "location__name"]
Slot_filter_fields = ['date', 'start_time', 'alloted_slots', 'booked_slots', 'allow_overbooking', 'interview_location__name' ,'channel', 'work_location__name', 'spoc__email']
Candidate_slot_mapping_filter_fields = [f'slot__{field}' for field in Slot_filter_fields]

for item in Jobs_filter_fields:
    HiringEvent_filter_fields.append("job__" + item)
    JobCandidate_filter_fields.append("job__" + item)
    Slot_filter_fields.append("job__" + item)
    Candidate_slot_mapping_filter_fields.append("slot__job__" + item)