import { Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContentText from "@mui/material/DialogContentText";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Loader from "../loader/Loader";
import { useDeleteRoomMutation } from "../../store/room/roomApiSlice";
import { setRoomInfo } from "../../store/room/roomSlice";
import {
  setErrorAlert,
  setSuccessAlert,
} from "../../store/notification/notificationSlice";
import socket from "../../socket";

const DeleteRoom = ({ setParentClose, open, setOpen }) => {
  const navigate = useNavigate();
  const [deleteRoom, { isLoading }] = useDeleteRoomMutation();
  const { roomInfo } = useSelector((state) => state.room);
  const dispatch = useDispatch();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setParentClose();
  };

  const onDeleteRoom = async () => {
    try {
      const response = await deleteRoom({
        roomCode: roomInfo.roomCode,
      }).unwrap();
      socket.emit("deleteRoom", roomInfo.roomCode);
      dispatch(setRoomInfo(null));
      dispatch(setSuccessAlert(response));
      navigate("/chatroom");
    } catch (err) {
      dispatch(setErrorAlert(err?.data?.message || err.error));
    }
  };

  if (isLoading) {
    return <Loader isLoading={isLoading} />;
  }

  return (
    <Fragment>
      <Button color="secondary" variant="contained" onClick={handleOpen}>
        Delete Room
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: "div",
        }}
      >
        <DialogTitle>Delete Room</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers className="flex flex-col gap-5">
          <DialogContentText>
            Are you sure you want to delete <b>{roomInfo.roomName}</b>? This
            will permanently delete the room <b>{roomInfo.roomName}</b>, chat
            history, and remove all members.
          </DialogContentText>

          <Button
            color="error"
            variant="contained"
            onClick={onDeleteRoom}
            className="flex gap-1.5"
          >
            {`Yes, I want to delete `}
            {<b>{roomInfo.roomName}</b>}
          </Button>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default DeleteRoom;
