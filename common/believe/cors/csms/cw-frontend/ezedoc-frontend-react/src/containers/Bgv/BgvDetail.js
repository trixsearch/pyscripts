import React, { useState } from "react";

import Spinner from "components/UI/Spinner/Spinner";
import { BgvCard } from "containers/Process/ProcessView/PersonalDetail/BgvDetails";

const data = {
  id: "b893502c-7680-4490-8eb7-2ebda6b8dc87",
  is_deleted: false,
  deleted_at: null,
  created_at: "2021-02-09T13:01:40.799665Z",
  updated_at: "2021-02-09T13:01:40.799681Z",
  valid_upto: null,
  check_type: "CRC",
  status: "Red",
  partner_id: null,
  partner_transaction_id: "Valuepitch",
  tenant_id: "www1",
  profile: "c1073f1c-6dee-49b6-a4ef-ba1870376a84",
  entity_name: "Harish",
};

const Bgv = () => {
  const [loader] = useState(false);
  let activeId = data.id

  return (
    <div>
      {loader && <Spinner />}
      <div
        className="main_changable_container"
        style={{
          height: window.innerHeight - 56 - 3,
        }}
      >
        <div className="process_details_tab_cont config_location_view">
          <ul className="process_tab_ongoing_comp_ul" id="myTab" role="tablist">
            <li className="process_tab_last_li">
              <div className="process_details_btn_cont" />
            </li>
          </ul>
          <div className="config_table_list_box">
            <BgvCard
              key={data.id}
              item={data}
              showEntityPhoto
              addToast={() => {}}
              active={data.id === activeId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bgv;
