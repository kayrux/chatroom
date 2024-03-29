import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Loader from "../loader/Loader";
import { useRegisterMutation } from "../../store/user/userApiSlice";
import { setUserInfo } from "../../store/user/userSlice";
import {
  setErrorAlert,
  resetNotification,
} from "../../store/notification/notificationSlice";

const defaultFormFields = {
  username: "",
  password: "",
};

const SignUp = () => {
  const [userCredential, setUserCredential] = useState(defaultFormFields);
  const { username, password } = userCredential;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const resetFormFields = () => {
    setUserCredential(defaultFormFields);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setUserCredential({ ...userCredential, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const res = await register({ username, password }).unwrap();
      dispatch(setUserInfo({ ...res }));
      dispatch(resetNotification());
      navigate("/chatroom");
    } catch (err) {
      dispatch(setErrorAlert(err?.data?.message || err.error));
    }
    resetFormFields();
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  return (
    <div className="pt-3 pb-5 px-4">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <TextField
          label="Username"
          type="text"
          required
          onChange={handleChange}
          name="username"
          value={username}
          variant="outlined"
        />

        <TextField
          label="Password"
          type="password"
          required
          onChange={handleChange}
          name="password"
          value={password}
          variant="outlined"
        />
        <Button type="submit" color="secondary" variant="contained">
          Sign Up
        </Button>
      </form>
    </div>
  );
};

export default SignUp;
