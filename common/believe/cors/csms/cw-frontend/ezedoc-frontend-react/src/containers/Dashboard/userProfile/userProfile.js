import React, { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";
import ReactPhoneInput from "react-phone-input-2";

import { Button } from "components/UI/AppButton/AppButton";

import SignaturePad from "signature_pad";
import axios from "axios";
import { SyncOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

import {
  profileGet,
  profileUpdate,
  resetPwd,
  profilephotoUpdate,
  signaturephotoUpdate,
  signaturedrawphotoUpdate,
} from "../../../store/actions/index";
import "./userProfile_manageAC.css";
import "react-phone-input-2/dist/style.css";
import { getFullName } from "../../utils";
import IdCard from "./IdCard";

import userProfileImg from "../../../assets/images/userProfile.png";

const APP_URL = process.env.REACT_APP_APP_URL;

const Input = ({
  handleChange,
  handleBlur,
  value,
  error,
  touched,
  type,
  name,
  label,
}) => (
  <div className="form_up_box floating-label">
    <input
      name={name}
      placeholder=" "
      type={type}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={error && touched ? "floating-input Invalid" : "floating-input"}
    />
    <label>{label}</label>
    {error && touched && (
      <span style={{ color: "red", marginTop: ".15rem" }}>{error}</span>
    )}
  </div>
);

const UserProfile = (props) => {
  const can = useRef(null);
  const drawRef = useRef(null);
  const uploadRef = useRef(null);
  const addRef = useRef(null);
  const displayRef = useRef(null);
  const uploadImgRef = useRef(null);
  const signAddRef = useRef(null);
  const changeSignRef = useRef(null);
  const saveSignRef = useRef(null);
  const uploadButton = useRef(null);
  const drawButton = useRef(null);

  let cs = changeSignRef.current;
  let ss = saveSignRef.current;
  let ds = displayRef.current;
  let a = addRef.current;
  let u = uploadRef.current;
  let d = drawRef.current;
  let uploadImg = uploadImgRef.current;
  let uploadRadio = uploadButton.current;
  let drawRadio = drawButton.current;

  const minLength = 8;

  const profile = props.profile;
  const userId = props.userId;
  const { uuid: orgId } = useParams();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  const [mobile, setMobile] = useState("");
  const [oldMobile, setOldMobile] = useState("");

  const [showChangePSWD, setShowChangePSWD] = useState(false);
  const [showSetPHNumber, setShowSetPhNumber] = useState(false);
  const [idCard, setIdCard] = useState(false);

  const [showDrawSignature, setDrawSignature] = useState(false);
  const [showUploadSignature, setUploadSignature] = useState(false);
  const [file, setFile] = useState({ urll: "" });
  const [signImage, setSignImage] = useState({ urll: "" });
  const [signaturePad2, setSignaturePad2] = useState(null);
  const [displayButton, setDisplayButton] = useState(true);

  if (mobile === "" && profile.mobile && mobile !== profile.mobile) {
    setMobile(profile.mobile);
    setOldMobile(profile.mobile);
  }

  const { getProfile } = { ...props };

  useEffect(() => {
    getProfile(orgId);
  }, [getProfile, orgId]);

  const resetPwdStatus = (response) => {
    if (response.success !== "false" && response.success) {
      setMessage(response.message);
      setMessageType("success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      let responseMessage = response.message
        ? response.message
        : "Unexpected Error Occured.";
      setMessage(responseMessage);
      setMessageType("error");
    }
  };

  const resetPasswordHandler = () => {
    if (newPassword && oldPassword && confirmPassword) {
      if (newPassword === oldPassword) {
        setMessage("Old Password and New Password should not be same.");
        setMessageType("error");
      } else if (newPassword.length < minLength) {
        setMessage("New Password should have minimum 8 characters.");
        setMessageType("error");
      } else if (newPassword !== confirmPassword) {
        setMessage("New Password specified is not matching");
        setMessageType("error");
      } else {
        let data = { new_password: newPassword, password: oldPassword };
        props.resetPwd(orgId, data, resetPwdStatus);
        setShowChangePSWD(false);
      }
    } else {
      setMessage("Old Password or New Password shouldn't be blank.");
      setMessageType("error");
    }
  };

  const updateHandler = (e) => {
    e.preventDefault();
    let data = {
      mobile,
    };
    setOldMobile(mobile);
    props.profileUpdate(orgId, userId, data);
    setShowSetPhNumber(false);
  };

  const onUpload = (e) => {
    let data = {
      profilePhoto: e.target.files[0],
      id: userId,
    };
    props.profilephotoUpdate(orgId, data);
    e.target.value = null;
  };

  let messageColour = "red";
  if (messageType === "success") {
    messageColour = "green";
  }
  let buttonDisabled = true;
  if (
    mobile.length === 13
    && profile.mobile !== mobile
    && mobile !== oldMobile
  ) {
    buttonDisabled = false;
  }

  const getImage = () => {
    const id = localStorage.getItem("userId");
    let timestamp = `?${new Date().getTime()}`;

    const url = `${APP_URL}/${orgId}/users/org_users/${id}/signature${timestamp}`;
    axios({
      method: "get",
      url,
      responseType: "blob",
    })
      .then((response) => {
        if (response.data !== 0) {
          const fileReaderInstance = new FileReader();
          fileReaderInstance.readAsDataURL(response.data);
          fileReaderInstance.onload = () => {
            const base64data = fileReaderInstance.result;
            setSignImage({ urll: base64data });
          };
        }
      })
      .catch(() => {});
  };

  const sign = profile.signaturePhoto;

  useEffect(() => {
    if (sign) {
      getImage();
    }
  }, [sign]);

  const updateSignature = () => {
    cs.style.display = "block";
    ss.style.display = "none";
    ds.style.display = "block";
    a.style.display = "none";
    uploadRadio.checked = false;
    drawRadio.checked = false;
    uploadImg.style.display = "none";
    d.style.display = "none";
    u.style.display = "none";
    setDisplayButton(true);

    if (showDrawSignature) {
      if (signaturePad2.isEmpty() === false) {
        let drawSign = signaturePad2.toDataURL("image/png");

        let data = {
          signaturePhoto: drawSign,
          id: userId,
        };

        props.signaturedrawphotoUpdate(orgId, data);
      }
    }

    if (showUploadSignature) {
      let uploadSign = signImage.urll;
      if (uploadSign !== "null") {
        let data = {
          signaturePhoto: uploadSign,
          id: userId,
        };

        props.signaturephotoUpdate(orgId, data);
      }
    }
  };

  const changeSignature = () => {
    cs.style.display = "none";
    a.style.display = "block";
    ds.style.display = "none";
  };

  const uploadSignature = () => {
    setUploadSignature(true);
    setDrawSignature(false);
    setDisplayButton(true);

    u.style.display = "block";
    d.style.display = "none";
    ss.style.display = "block";
  };

  const drawSignature = () => {
    ss.style.display = "block";
    uploadImg.style.display = "none";

    setDrawSignature(true);
    setUploadSignature(false);
    setDisplayButton(true);
    d.style.display = "block";
    u.style.display = "none";
    const img = new SignaturePad(can.current, {
      penColor: "rgb(0, 0, 0)",
    });
    setSignaturePad2(img);
  };

  useEffect(() => {
    if (signaturePad2 !== null) {
      signaturePad2.addEventListener(
        "afterUpdateStroke",
        () => {
          setDisplayButton(false);
        },
        { once: true }
      );
    }
  }, [signaturePad2]);

  const handleUpload = (e) => {
    uploadImg.style.display = "block";
    setSignImage({ urll: e.target.files[0] });
    setFile({ urll: URL.createObjectURL(e.target.files[0]) });
    setDisplayButton(false);
  };

  const clearSignature = () => {
    signaturePad2.clear();
    setDisplayButton(true);
    signaturePad2.addEventListener(
      "afterUpdateStroke",
      () => {
        setDisplayButton(false);
      },
      { once: true }
    );
  };

  return (
    <>
      <div className="manage_profile_cont">
        <div className="row">
          <div className="col-md-12">
            <IdCard
              open={idCard}
              onClose={() => {
                setIdCard(false);
              }}
              orgLogo={props.org.logo}
              address={props.org.org_address}
              designation={profile.groupName}
              profilePic={
                profile.profilePhoto ? profile.profilePhoto : userProfileImg
              }
              personName={getFullName(
                profile.firstName,
                profile.middleName,
                profile.lastName
              )}
            />
            <div className="row">
              <div className="col-md-5">
                <div className="row">
                <div className="col-md-6">
                  <div className="profile_pic">
                    <img
                      className="img-fluid"
                      style={{ borderRadius: "50%", margin: "auto" }}
                      src={
                        profile.profilePhoto
                          ? `${profile.profilePhoto}?${new Date().getTime()}`
                          : userProfileImg
                      }
                      alt="Logo"
                    />
                    <div className="profile_pic_edit_btn">
                      <label className="profile_pic_edit_label">
                        <span className="icon icon-edit edit_icon" />
                        <input
                          accept="image/jpeg,image/jpg,image/png,"
                          type="file"
                          style={{ display: "none" }}
                          onChange={onUpload}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="my-id-card-btn">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIdCard(true);
                      }}
                      disabled={!profile.firstName}
                    >
                      My ID Card
                    </Button>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="manage_ap_details col-md-12">
                    <h3>
                      {getFullName(
                        profile.firstName,
                        profile.middleName,
                        profile.lastName
                      )}
                    </h3>
                    <h5>{profile.groupName}</h5>
                  </div>
                  <div className="manage_ap_details col-md-12">
                    <h3>Manager</h3>
                    <h5>
                      {profile.manager
                        ? getFullName(
                            profile.manager.first_name,
                            profile.manager.middle_name,
                            profile.manager.last_name
                          )
                        : "-"}
                    </h5>
                  </div>
                </div>
                

                <div className="col-md-12">
                  <br />
                  <br />
                </div>
                <div className="col-md-6">
                  <h5>Signature : </h5>
                </div>
                <div className="col-md-6 ">
                  <img
                    className="signature-image"
                    ref={displayRef}
                    src={signImage.urll ? signImage.urll : ""}
                    alt=""
                    style={{ display: "block" }}
                  />

                  <div
                    className="change-signature"
                    ref={changeSignRef}
                    style={{ display: "block" }}
                  >
                    <Button
                      variant="link"
                      onClick={() => {
                        changeSignature();
                      }}
                    >
                      Change Signature
                    </Button>
                  </div>
                </div>
                

                <div
                  className=" col-md-12 signature-add__container"
                  ref={signAddRef}
                  style={{ display: "block" }}
                >
                  <div
                    className="signature-add__type-selection my-3"
                    ref={addRef}
                    style={{ display: "none" }}
                  >
                    <div className="form-check form-check-inline col-md-6">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="signatureType"
                        id="newSignatureUpload"
                        ref={uploadButton}
                        value="upload"
                        onClick={() => {
                          uploadSignature();
                        }}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="newSignatureUpload"
                      >
                        Upload Signature
                      </label>

                      <div
                        className="signature-add__upload my-3"
                        ref={uploadRef}
                        style={{ display: "none" }}
                      >
                        <div className="btn btn-primary">
                          <label className="signature-upload-label">
                            Choose File
                            <input
                              accept="image/jpeg,image/jpg,image/png,"
                              type="file"
                              style={{ display: "none" }}
                              onChange={handleUpload}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="form-check form-check-inline col-md-6">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="signatureType"
                        id="newSignatureDraw"
                        ref={drawButton}
                        value="draw"
                        onClick={() => {
                          drawSignature();
                        }}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="newSignatureDraw"
                      >
                        Draw Signature
                      </label>
                    </div>

                    <div className="signature-add__img-container col-md-12 d-flex justify-content-center">
                      <img
                        className="signature-add__img"
                        id="uploadedSignatureImg"
                        ref={uploadImgRef}
                        src={file.urll ? file.urll : ""}
                        alt=""
                        style={{ display: "none" }}
                      />
                    </div>

                    <div
                      className="signature-add__draw my-3 col-md-12"
                      id="sg"
                      ref={drawRef}
                      style={{ display: "none" }}
                    >
                      <div id="signature-pad" className="signature-pad">
                        <div className="signature-pad--body d-flex">
                          <canvas ref={can} />
                        </div>
                        <div className="signature-pad--footer">
                          <div className="text-center signature-pad--text">
                            Sign above
                          </div>
                          <button
                            type="button"
                            className="btn signature-clear"
                            data-action="clear"
                            title="Clear Signature"
                          >
                            <SyncOutlined
                              style={{ color: "red" }}
                              onClick={() => {
                                clearSignature();
                              }}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="profile-details__row d-flex form-group ">
                    <div
                      className="signature-save-btn"
                      ref={saveSignRef}
                      style={{ display: "none" }}
                    >
                      <Button
                        variant="primary"
                        onClick={() => {
                          updateSignature();
                        }}
                        disabled={displayButton}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
                </div>

              </div>
              <div className="col-md-7 change-number-pswd-cont">
                <div className="row">
                <div
                  className={showChangePSWD ? "col-md-12 well" : "col-md-12"}
                  style={{ flexWrap: "wrap", alignItems: "center" }}
                >
                  {showChangePSWD ? (
                    <>
                      <div className="col-md-6 pt-10">
                        <Input
                          className="floating-point"
                          value={oldPassword}
                          type="password"
                          autocomplete="false"
                          name="old_password"
                          label="Old Password"
                          handleChange={(e) => setOldPassword(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 pt-10">
                        <Input
                          className="floating-point"
                          value={newPassword}
                          type="password"
                          autocomplete="false"
                          name="new_password"
                          label="New Password"
                          handleChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 pt-10">
                        <Input
                          className="floating-point"
                          value={confirmPassword}
                          type="password"
                          autocomplete="false"
                          name="confirm_password"
                          label="Confirm Password"
                          handleChange={(e) => setConfirmPassword(e.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <div style={{ padding: "20px 0" }}>
                          <button
                            type="button"
                            onClick={resetPasswordHandler}
                            className="fancy_btn active"
                          >
                            Save Password
                          </button>
                        </div>
                      </div>
                      {message && (
                        <span
                          style={{ color: messageColour, marginLeft: "16px" }}
                        >
                          {message}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="change_mobile_text">
                      <Button
                        variant="link"
                        onClick={() => {
                          setShowChangePSWD(true);
                        }}
                      >
                        Change Password
                      </Button>
                    </div>
                  )}
                </div>

                <div
                  className={showSetPHNumber ? "col-md-12 well" : "col-md-12"}
                >
                  {showSetPHNumber ? (
                    <div className="user-profile-ph-input-cont">
                      <ReactPhoneInput
                        placeholder="Phone number"
                        value={mobile || "+91"}
                        countryCodeEditable={false}
                        inputClass="floating-point col-md-6"
                        disableDropdown
                        onChange={(mobileNumber) => {
                          setMobile(
                            mobileNumber.replace(/\s/g, "").replace(/-/g, "")
                          );
                        }}
                        onlyCountries={["in"]}
                      />

                      <div style={{ padding: "20px 0", alignSelf: "flex-end" }}>
                        <button
                          type="button"
                          onClick={updateHandler}
                          disabled={buttonDisabled}
                          className="fancy_btn active"
                        >
                          Save Mobile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="change_mobile_text">
                      <Button
                        variant="link"
                        onClick={() => {
                          setShowSetPhNumber(true);
                        }}
                      >
                        Change Mobile Number
                      </Button>
                    </div>
                  )}
                </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="manage_ap_emp col-md-12 build-version-text">
        <p className="manage_ap_emp_text">
          Build version
          <small style={{ paddingLeft: "1em" }}>
            {process.env.REACT_APP_APPVERSION || "-"}
          </small>
        </p>
      </div>
    </>
  );
};

const mapStateToProps = ({ profile, auth, orgLogo }) => ({
  org: orgLogo,
  profile: profile,
  userId: auth.id,
});

const mapDispatchToProps = (dispatch) => ({
  getProfile: (orgId) => dispatch(profileGet(orgId)),
  profilephotoUpdate: (orgId, data) => dispatch(profilephotoUpdate(orgId, data)),
  profileUpdate: (orgId, id, userData) => dispatch(profileUpdate(orgId, id, userData)),
  resetPwd: (orgId, userData, status) => dispatch(resetPwd(orgId, userData, status)),
  signaturephotoUpdate: (orgId, data) => dispatch(signaturephotoUpdate(orgId, data)),
  signaturedrawphotoUpdate: (orgId, data) => dispatch(signaturedrawphotoUpdate(orgId, data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserProfile);
