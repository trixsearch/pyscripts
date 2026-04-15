import useScript from "ezereactcomponents/CustomHooks/useScript";

import "../App.css";
import '../assets/img_font/style.css';


const Resources = () => {

  window.$crisp = [];
  window.CRISP_WEBSITE_ID = process.env.REACT_APP_CRISP_WEBSITE_ID;

  useScript(process.env.REACT_APP_ONPREM === "" ? '' : 'https://client.crisp.chat/l.js', true);

  return (null);
};

export default Resources;
