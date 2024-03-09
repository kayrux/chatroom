const asyncHandler = require("express-async-handler");
const generateToken = require("../utils/generateToken.js");
const db = require("../models");
const User = db.users;

/**
 * @desc register a new user
 * @route POST /api/users/register
 * @access public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400); //400 Bad Request
    throw new Error("Please fill in all fields");
  }

  // check to see if username already exists in the user database
  const userExists = await User.findOne({
    where: {
      username,
    },
  });

  if (userExists) {
    return res.status(400).send({ message: "Username already taken" });
  }

  const user = await User.create({
    username,
    password,
  });

  if (user) {
    generateToken(res, user.uid);

    return res.status(201).json({
      uid: user.uid,
      username: user.username,
    });
  } else {
    return res
      .status(400)
      .send({ message: "Could not create user - Invalid entry" });
  }
});

/**
 * @desc login/authenticate a user
 * @route POST /api/users/login
 * @access public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Please fill in all fields" }); //400 Bad Request
  }

  const user = await User.findOne({
    where: {
      username,
    },
  }); // find by username

  if (user && (await user.verifyPassword(password))) {
    generateToken(res, user.uid);

    return res.status(200).json({
      uid: user.uid,
      username: user.username,
    });
  } else {
    return res.status(401).send({ message: "Invalid username or password" });
  }
});

/**
 * @desc logout user / clear cookie
 * @route POST /api/users/logout
 * @access public
 */
const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * @desc get user profile
 * @route GET /api/users/profile
 * @access private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.uid);

  if (user) {
    res.status(200).json({
      uid: user.uid,
      username: user.username,
      rooms: user.rooms,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/**
 * @desc update user profile
 * @route PUT /api/users/profile
 * @access private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.uid);

  if (req.body.username) {
    // check to see if username already exists in the user database
    const usernameExists = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (usernameExists) {
      return res.status(400).send({ message: "Username already taken" });
    }
  }

  if (user) {
    await user.update(
      { username: req.body.username },
      {
        where: {
          uid: req.body.uid,
        },
      }
    );

    return res.status(200).json({
      uid: user.uid,
      username: user.username,
    });
  } else {
    return res.status(404).send({ message: "User not found" });
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};