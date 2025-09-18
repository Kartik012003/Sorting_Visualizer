const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Storage = require("../models/storage");
const Service = require("../services/services");
const Config = require("../models/userConfig");
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;
const baseUrl = process.env.LEAD_POST_URL;
const crypto = require("crypto");
const Session = require("../models/session");


async function createUser(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { userid, username, email, password, company, phone } =
      decryptedPayload;
    // const {userid, username, email, password ,company,phone } = req.body;

    if (username === "") {
      return res.status(400).json({ message: "User Name is required." });
    }

    if (email === "") {
      return res.status(400).json({ message: "Email Id  is required." });
    }

    if (password === "") {
      return res.status(400).json({ message: "Password  is required." });
    }
    // Check if the user already exists with the provided email or username
    const existingUser = await User.findOne({ $or: [{ email }] });
    if (existingUser) {
      return res.status(200).json({
        message: "User already exists .Please ensure , Email is unique.",
      });
    }
    // user validatation state here
    // delete mail data if store previsouly
    const filter = { name: email, type: "otp-email-registration" };
    // Perform the delete operation
    const result = await Storage.findOneAndDelete(filter);
    const randomNumber = Math.floor(Math.random() * 1000000);
    const otp = randomNumber.toString().padStart(6, "0");
    // console.log("system genrerter otp : ", otp);
    const mailResult = Service.sendMail(email, otp, username, "registration");
    // console.log("email send or not : ", mailResult);
    if (mailResult) {
      // save otp detail to database for opt varificatin step:
      const newEmail = new Storage({
        name: email,
        type: "otp-email-registration",
        content: otp,
        start: new Date(),
        temp_data: decryptedPayload,
      });
      // const newEmail = new Storage({ name: email, type:'otp-email-registration', content:otp,start:new Date(),temp_data:req.body});
      await newEmail.save();
      const filter = { _id: newEmail._id };
      const update = { mail_sent: true };
      const options = { new: true };
      const updateStorage = await Storage.findOneAndUpdate(
        filter,
        update,
        options
      );
      res
        .status(201)
        .json({ message: "OTP has been sent to your email address." });
    } else {
      res
        .status(404)
        .json({ message: "Failed to send mail.Try again after some time." });
    }
    // end here
    // If the user doesn't exist, create a new user
    // dynamic_user_id = await Service.generate_user_key(req.body)
    // const newUser = new User({ userid: dynamic_user_id, username, email, password,company, phone});

    // await newUser.save();
    // res.status(201).json({ message: 'New User has been Created Successfully.', user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// for forget password for validate otp
// old working code ===================================================
// async function registrationEmailOptValidate(req, res) {
//   try {
//     const { email, key, otp } = req.body;
//     // console.log("user email: for validate ", req.body);
//     // const user = await User.findOne({ $and: [{ email }] });
//     const storage = await Storage.findOne({
//       $and: [{ name: email }, { type: "otp-email-registration" }],
//     });
//     console.log("email storage save or not::", storage);
//     if (!key) {
//       return res.status(404).json({ message: "Unauthorized Access." });
//     }
//     if (!storage) {
//       return res
//         .status(404)
//         .json({ message: "No OTP send for this email address." });
//     }

//     if (!otp) {
//       return res.status(404).json({ message: "User OTP is required." });
//     }

//     if (storage) {
//       console.log(
//         "***********saved otp for user: ",
//         storage.content,
//         " user input otp: ",
//         otp
//       );
//       if (storage.content == otp) {
//         const filter = { _id: storage._id };
//         const update = { mail_verified: true };
//         const options = { new: true };
//         const updateStorage = await Storage.findOneAndUpdate(
//           filter,
//           update,
//           options
//         );
//         // res.status(201).json({ message: 'OTP verified',email :storage.name });
//         // save user registration data start here
//         console.log("** storage temp data: ", storage.temp_data);
//         console.log("** ####storage temp data: ", typeof storage.temp_data);
//         dynamic_user_id = await Service.generate_user_key(storage.temp_data);
//         const { userid, username, email, password, company, phone } =
//           storage.temp_data;
//         console.log("****dynamic_user_id: ", dynamic_user_id);
//         console.log("****user id: ", userid);
//         console.log("****username: ", username);
//         console.log("****email: ", email);
//         console.log("****company: ", company);
//         console.log("****phone: ", phone);
//         const newUser = await new User({
//           userid: dynamic_user_id,
//           username,
//           email,
//           password,
//           company,
//           phone,
//         });
//         await newUser.save();

//         // code for saved existing configuration for new user
//         const assingConfig = await new Config({
//           userid: dynamic_user_id,
//           configname: "Demo",
//           configtype: "baseUrl",
//           // for live
//           // parameter   : 'https://hutch.oflowai.com',
//           // securitykey : '4ce85597-1b69-4fe7-b29e-8cf4cb5e880e',
//           // for innternal server
//           parameter: "http://122.160.26.224:8787",
//           securitykey: "b933c54a-47b4-4232-a659-84f32320ccb9",
//           isactive: true,
//           database: "hutch",
//           databasetype: "existing",
//         });
//         await assingConfig.save();
//         // end for adding existing configuration while creating new user

//         // call lead post on other url start here
//         const lead_post_obj = {
//           api_key: apiKey,
//           name: username,
//           email: email,
//           company: company,
//           contact: phone,
//         };
//         console.log("***new lead post data req obj: ", lead_post_obj);
//         create_end_point = "/process/crm";
//         const apiUrl = `${baseUrl}${create_end_point}`;
//         console.log("before lead post : ", apiUrl);
//         // console.log("we are in odoo cheking step: ", updateProcess.process_image)
//         if (false) {
//           // console.log("xxxxxxxxwe are in if block : json.stringify ", JSON.stringify(updateProcess.odoo_checking_data ))
//           fetch(apiUrl, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify(lead_post_obj),
//           })
//             .then((response) => {
//               console.log("rrrrrrrrrrr respoonse data: ", response);
//               if (!response.ok) {
//                 // throw new Error(`HTTP error! status: ${response.status}`);
//                 // res.status(400).json({ message: 'Internal server error due to BAD_RREQUEST'});
//                 console.log("*** some eerror in lead post");
//               }
//               return response.json();
//             })
//             .then((data) => {
//               // Handle the response data
//               console.log("**********data : ", data, data.result);

//               // res.status(201).json({ message:  JSON.parse(data.result)});
//             })
//             .catch((error) => {
//               // Handle the error
//               console.error(" rrrrrrrrrrrrError:", error);
//               // res.status(400).json({ message: 'Internal server error.' });
//             });
//         }
//         // call lead post on other url end  here

//         res.status(201).json({
//           message:
//             "OTP Verified and new User has been Created Successfully.Please login",
//           user: newUser,
//         });
//         // end here
//       } else {
//         res.status(401).json({ message: "User OTP is invalid." });
//       }
//     } else {
//       res.status(401).json({ message: "No OTP send for this email address." });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for email otp validation ==================================
async function registrationEmailOptValidate(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email, key, otp } = decryptedPayload;
    // const { email, key, otp } = req.body;
    // console.log("user email: for validate ", req.body);
    // const user = await User.findOne({ $and: [{ email }] });
    const storage = await Storage.findOne({
      $and: [{ name: email }, { type: "otp-email-registration" }],
    });
    console.log("email storage save or not::", storage);
    if (!key) {
      return res.status(404).json({ message: "Unauthorized Access." });
    }
    if (!storage) {
      return res
        .status(404)
        .json({ message: "No OTP send for this email address." });
    }

    if (!otp) {
      return res.status(404).json({ message: "User OTP is required." });
    }

    if (storage) {
      // console.log(
      //   "***********saved otp for user: ",
      //   storage.content,
      //   " user input otp: ",
      //   otp
      // );
      if (storage.content == otp) {
        const filter = { _id: storage._id };
        const update = { mail_verified: true };
        const options = { new: true };
        const updateStorage = await Storage.findOneAndUpdate(
          filter,
          update,
          options
        );
        // res.status(201).json({ message: 'OTP verified',email :storage.name });
        // save user registration data start here
        // console.log("** storage temp data: ", storage.temp_data);
        // console.log("** ####storage temp data: ", typeof storage.temp_data);
        dynamic_user_id = Service.generate_user_key(storage.temp_data);
        const { userid, username, email, password, company, phone } =
          storage.temp_data;
        // console.log("****dynamic_user_id: ", dynamic_user_id);
        // console.log("****user id: ", userid);
        // console.log("****username: ", username);
        // console.log("****email: ", email);
        // console.log("****company: ", company);
        // console.log("****phone: ", phone);
        const newUser = new User({
          userid: dynamic_user_id,
          username,
          email,
          password,
          company,
          phone,
        });
        await newUser.save();

        // code for saved existing configuration for new user
        const assingConfig = new Config({
          userid: dynamic_user_id,
          configname: "Demo",
          configtype: "baseUrl",
          // for live
          parameter: "https://hutch.oflowai.com",
          database: "hutch",
          securitykey: "d8457d7a-eef0-4299-b7e5-198328d45273",
          license_key: "OFLOWAI00202500DEMO00O2B",
          // for innternal server
          // parameter: "http://122.160.26.224:8787",
          // securitykey: "d8477a9a-489a-421b-b639-c0dad35e69e2",
          // database: "oflow",
          // license_key: "OFLOWAI00202500DEMO00O2B",
          isactive: true,
          databasetype: "existing",
        });

        await assingConfig.save();
        // end for adding existing configuration while creating new user

        
        // call send mail after register successfull
        const mailResult = Service.sendMail(email, '', username, "post_registration");
        //  send post registeration mail

        // call lead post on other url start here
        const lead_post_obj = {
          api_key: apiKey,
          name: username,
          email: email,
          company: company,
          contact: phone,
        };
        // console.log("***new lead post data req obj: ", lead_post_obj);
        create_end_point = "/process/crm";
        const apiUrl = `${baseUrl}${create_end_point}`;
        // console.log("before lead post : ", apiUrl);
        // console.log("we are in odoo cheking step: ", updateProcess.process_image)
        if (false) {
          // console.log("xxxxxxxxwe are in if block : json.stringify ", JSON.stringify(updateProcess.odoo_checking_data ))
          fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(lead_post_obj),
          })
            .then((response) => {
              console.log("rrrrrrrrrrr respoonse data: ", response);
              if (!response.ok) {
                // throw new Error(`HTTP error! status: ${response.status}`);
                // res.status(400).json({ message: 'Internal server error due to BAD_RREQUEST'});
                console.log("*** some eerror in lead post");
              }
              return response.json();
            })
            .then((data) => {
              // Handle the response data
              console.log("**********data : ", data, data.result);

              // res.status(201).json({ message:  JSON.parse(data.result)});
            })
            .catch((error) => {
              // Handle the error
              console.error(" rrrrrrrrrrrrError:", error);
              // res.status(400).json({ message: 'Internal server error.' });
            });
        }
        // call lead post on other url end  here

        res.status(201).json({
          message:
            "OTP Verified and new User has been Created Successfully.Please login",
          user: newUser,
        });
        // end here
      } else {
        res.status(401).json({ message: "User OTP is invalid." });
      }
    } else {
      res.status(401).json({ message: "No OTP send for this email address." });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// Login code ==========================================================
// login code for internal and local server
// async function loginUser(req, res) {
//   try {
//     const encryptedData = req.body.data;
//     const deployedPayload = Service.decryptData(encryptedData, payloadSecret);
//     const { email, password, deviceInfo } = deployedPayload;
//     // const { email, password } = req.body;
//     const user = await User.findOne({
//       $and: [{ email }, { password: password }],
//     });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const existSession = await Session.findOne({ userId: user._id });
//     if (existSession) {
//       return res.status(402).json({
//         message:
//           "User already logged in other session or device.Please logout from all devices.",
//       });
//     }

//     // Generate a new token
//     const token = jwt.sign({ userId: user._id }, "SECRET_KEY", {
//       expiresIn: "1d",
//     });

//     // Save the session
//     await new Session({ userId: user._id, token, deviceInfo }).save();

//     // start code for check this user email is not login already
//     res.status(201).json({ message: "Login successful", user, token });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }

// login code for live server
async function loginUser(req, res) {
  try {
    const encryptedData = req.body.data;
    const deployedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email, password, deviceInfo } = deployedPayload;
    // const { email, password } = req.body;
    const user = await User.findOne({
      $and: [{ email }, { password: password }],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const existSession = await Session.findOne({ userId: user._id });
    if (existSession) {
      return res.status(402).json({
        message:
          "User already logged in other session or device.Please logout from all devices.",
      });
    }

    // only manish sir can login code start here
    // if (
    //   [
    //     "manish@o2b.co.in",
    //     "jaime.maldonado@wisesolutionspr.com",
    //     "santosh.sharma@o2binfotech.com",
    //     "demo@oflowai.com",
    //     "accountant@bwealthics.com"
    //   ].includes(user.email)
    // ) {
    if(true)
    {
      // Generate a new token
      const token = jwt.sign({ userId: user._id }, "SECRET_KEY", {
        expiresIn: "1d",
      });

      // Save the session
      await new Session({ userId: user._id, token, deviceInfo }).save();

      // start code for check this user email is not login already
      res.status(201).json({ message: "Login successful", user, token });
    } else {
      return res.status(404).json({
        message: "Unauthorized Access. Please contact to administrator.",
      });
    }
    // only manish sir can login code end  here
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}
// login code over ======================================================

// method for logout from all sessions
async function logout(req, res) {
  const { userId } = req.body;

  // Remove all sessions for the user
  await Session.deleteOne({ userId });
  res.status(200).json({ message: "Logout successful." });
}

// method for logout from all sessions
async function logoutAll(req, res) {
  const { email, password, deviceInfo } = req.body.data;

  const user = await User.findOne({
    $and: [{ email }, { password: password }],
  });

  // Remove all sessions for the user
  await Session.deleteMany({ userId: user._id });
  // Generate a new token
  const token = jwt.sign({ userId: user._id }, "SECRET_KEY", {
    expiresIn: "1d",
  });

  // Save the session
  await new Session({ userId: user._id, token, deviceInfo }).save();
  res.status(200).json({ message: "Login successful", user, token });
}

// ***remove logged in user****

async function removeloginUser(req, res) {
  try {
    const encryptedData = req.body.data;
    const deployedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email, password } = deployedPayload;
    // const { email, password } = req.body;
    const user = await User.findOne({
      $and: [{ email }, { password: password }],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // start code for check this user email is not login already
    if (user && user.login_status === true) {
      const userId = user._id;
      const filter = { _id: userId }; // Match the unique record by ID
      const update = { $set: { login_status: false } }; // Specify the field to update and its new value
      const result = await User.updateOne(filter, update);

      if (result.modifiedCount > 0) {
        console.log("use  updated successfully.");
        // return res.status(201).json({ message: "Login successful", user });
      } else {
        console.log("No user found or updated.");
      }
    }

    // start code for check this user email is not login already
    res.status(201).json({
      message: "Remove from other session or device. successful",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}
// ***remove logged in user****

// old working code =============================================================
// async function loginAdmin(req, res) {
//   try {
//     const { email, password, key } = req.body;
//     const user = await User.findOne({
//       $and: [{ email }, { password: password }, { phone: "xxxxxxxxxx" }],
//     });

//     if (!key) {
//       return res.status(404).json({ message: "Unauthorized Access." });
//     }
//     if (key != apiKey) {
//       return res.status(404).json({ message: "Unauthorized acess token." });
//     }

//     if (!user) {
//       return res.status(404).json({ message: "Accesd denied." });
//     }

//     const { userid } = user;
//     if (userid) {
//       return res.status(404).json({ message: "Accesd denied." });
//     }

//     console.log(" ***admin user: ", user);
//     res.status(201).json({ message: "Athenticated  user", user });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for admin login =====================================================
async function loginAdmin(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email, password, key } = decryptedPayload;
    // const { email, password, key } = req.body;
    const user = await User.findOne({
      $and: [{ email }, { password: password }, { phone: "xxxxxxxxxx" }],
    });

    if (!key) {
      return res.status(404).json({ message: "Unauthorized Access." });
    }
    if (key != apiKey) {
      return res.status(404).json({ message: "Unauthorized acess token." });
    }

    if (!user) {
      return res.status(404).json({ message: "Accesd denied." });
    }

    const { userid } = user;
    if (userid) {
      return res.status(404).json({ message: "Accesd denied." });
    }

    // console.log(" ***admin user: ", user);
    res.status(201).json({ message: "Athenticated  user", user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function allUser(req, res) {
  if (!req.query.api_key) {
    return res.status(404).json({ message: "Unauthorized acess" });
  }

  if (req.query.api_key != apiKey) {
    return res.status(404).json({ message: "Unauthorized acess token." });
  }
  try {
    const users = await User.find();
    if (!users) {
      return res.status(404).json({ error: "NO User not found" });
    }
    res.status(201).json({ message: "All User", users });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function updateUser(req, res) {
  try {
    const { email, password } = req.body;
    const filter = { email: email, password: password };
    const update = {
      username: req.body.update_username,
      password: req.body.update_password,
      email: req.body.update_email,
    };
    const options = { new: true };
    const updatedUser = await User.findOneAndUpdate(filter, update, options);
    if (!updatedUser) {
      return res.status(404).json({ message: "NO User not found" });
    }
    res
      .status(201)
      .json({ message: "User Updated successfully.", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// for forget password
// old working code ===================================================================
// async function forgetPasswordEmailCaputure(req, res) {
//   try {
//     const { email, key } = req.body;
//     console.log("user email: ", req.body);
//     const user = await User.findOne({ $and: [{ email }] });
//     if (!key) {
//       return res.status(404).json({ message: "Unauthorized Access." });
//     }
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "No user found for this email address." });
//     }
//     // delete mail data if store previsouly
//     const filter = { name: email, type: "otp-email" };
//     // Perform the delete operation
//     const result = await Storage.findOneAndDelete(filter);
//     const randomNumber = Math.floor(Math.random() * 1000000);
//     const otp = randomNumber.toString().padStart(6, "0");
//     console.log("system genrerter otp : ", otp);
//     const mailResult = Service.sendMail(email, otp, user.username, "forget");
//     console.log("email send or not : ", mailResult);
//     if (mailResult) {
//       res
//         .status(201)
//         .json({ message: "OTP has been sent to your email address." });
//       // save otp detail to database for opt varificatin step:
//       const newEmail = new Storage({
//         name: email,
//         type: "otp-email",
//         content: otp,
//         start: new Date(),
//       });
//       await newEmail.save();
//       const filter = { _id: newEmail._id };
//       const update = { mail_sent: true };
//       const options = { new: true };
//       const updateStorage = await Storage.findOneAndUpdate(
//         filter,
//         update,
//         options
//       );
//     } else {
//       res
//         .status(201)
//         .json({ message: "Failed to send mail.Try again after some time." });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for email capturing  ======================================================
async function forgetPasswordEmailCaputure(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email, key } = decryptedPayload;
    // const { email, key } = req.body;
    // console.log("user email: ", req.body);
    const user = await User.findOne({ $and: [{ email }] });
    if (!key) {
      return res.status(404).json({ message: "Unauthorized Access." });
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found for this email address." });
    }
    // delete mail data if store previsouly
    const filter = { name: email, type: "otp-email" };
    // Perform the delete operation
    const result = await Storage.findOneAndDelete(filter);
    const randomNumber = Math.floor(Math.random() * 1000000);
    const otp = randomNumber.toString().padStart(6, "0");
    // console.log("system genrerter otp : ", otp);
    const mailResult = Service.sendMail(email, otp, user.username, "forget");
    // console.log("email send or not : ", mailResult);
    if (mailResult) {
      res
        .status(201)
        .json({ message: "OTP has been sent to your email address." });
      // save otp detail to database for opt varificatin step:
      const newEmail = new Storage({
        name: email,
        type: "otp-email",
        content: otp,
        start: new Date(),
      });
      await newEmail.save();
      const filter = { _id: newEmail._id };
      const update = { mail_sent: true };
      const options = { new: true };
      const updateStorage = await Storage.findOneAndUpdate(
        filter,
        update,
        options
      );
    } else {
      res
        .status(201)
        .json({ message: "Failed to send mail.Try again after some time." });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// for forget password for validate otp
// old working code ===================================================================
// async function forgetPasswordEmailOptValidate(req, res) {
//   try {
//     const { email, key, otp } = req.body;
//     console.log("user email: for validate ", req.body);
//     const user = await User.findOne({ $and: [{ email }] });
//     const storage = await Storage.findOne({
//       $and: [{ name: email }, { type: "otp-email" }],
//     });
//     console.log("email storage save or not::", storage);
//     if (!key) {
//       return res.status(404).json({ message: "Unauthorized Access." });
//     }
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "No user found for this email address." });
//     }
//     if (!storage) {
//       return res
//         .status(404)
//         .json({ message: "No OTP send for this email address." });
//     }

//     if (!otp) {
//       return res.status(404).json({ message: "User OTP is required." });
//     }

//     if (storage) {
//       console.log(
//         "***********saved otp for user: ",
//         storage.content,
//         " user input otp: ",
//         otp
//       );
//       if (storage.content == otp) {
//         const filter = { _id: storage._id };
//         const update = { mail_verified: true };
//         const options = { new: true };
//         const updateStorage = await Storage.findOneAndUpdate(
//           filter,
//           update,
//           options
//         );
//         res.status(201).json({ message: "OTP verified", email: storage.name });
//       } else {
//         res.status(401).json({ message: "OTP not verified Sucessfully." });
//       }
//     } else {
//       res.status(401).json({ message: "No OTP send for this email address." });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for validating otp ========================================================
async function forgetPasswordEmailOptValidate(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email, key, otp } = decryptedPayload;
    // const { email, key, otp } = req.body;
    // console.log("user email: for validate ", req.body);
    const user = await User.findOne({ $and: [{ email }] });
    const storage = await Storage.findOne({
      $and: [{ name: email }, { type: "otp-email" }],
    });
    // console.log("email storage save or not::", storage);
    if (!key) {
      return res.status(404).json({ message: "Unauthorized Access." });
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found for this email address." });
    }
    if (!storage) {
      return res
        .status(404)
        .json({ message: "No OTP send for this email address." });
    }

    if (!otp) {
      return res.status(404).json({ message: "User OTP is required." });
    }

    if (storage) {
      // console.log(
      //   "***********saved otp for user: ",
      //   storage.content,
      //   " user input otp: ",
      //   otp
      // );
      if (storage.content == otp) {
        const filter = { _id: storage._id };
        const update = { mail_verified: true };
        const options = { new: true };
        const updateStorage = await Storage.findOneAndUpdate(
          filter,
          update,
          options
        );
        res.status(201).json({ message: "OTP verified", email: storage.name });
      } else {
        res.status(401).json({ message: "OTP not verified Sucessfully." });
      }
    } else {
      res.status(401).json({ message: "No OTP send for this email address." });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// for forget change password
// old working code ============================================================================
// async function forgetPasswordChange(req, res) {
//   try {
//     const { email, key, password } = req.body;
//     console.log("user email: ", req.body);
//     const user = await User.findOne({ $and: [{ email }] });
//     const storage = await Storage.findOne({
//       $and: [
//         { name: email },
//         { type: "otp-email" },
//         { mail_sent: true },
//         { mail_verified: true },
//       ],
//     });
//     console.log("email storage save or not::", storage);
//     if (!key) {
//       return res.status(404).json({ message: "Unauthorized Access." });
//     }
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "No user found for this email address." });
//     }
//     if (!storage) {
//       return res
//         .status(404)
//         .json({ message: "No OTP send for this email address." });
//     }

//     if (!password) {
//       return res.status(404).json({ message: "User Password is required." });
//     }

//     if (storage && storage.name == user.email) {
//       console.log("***********saved otp for user: ", storage.content);
//       const filter = { email: email };
//       const update = { password: password };
//       const options = { new: true };
//       const updatedUser = await User.findOneAndUpdate(filter, update, options);
//       if (!updatedUser) {
//         return res
//           .status(404)
//           .json({ message: "Internal sever error:Password not changed." });
//       }
//       res.status(201).json({ message: "Password Changed successfully." });
//     } else {
//       res.status(401).json({ message: "OTP is not verified yet." });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for changing password ==============================================================
async function forgetPasswordChange(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email, key, password } = decryptedPayload;
    // const { email, key, password } = req.body;
    // console.log("user email: ", req.body);
    const user = await User.findOne({ $and: [{ email }] });
    const storage = await Storage.findOne({
      $and: [
        { name: email },
        { type: "otp-email" },
        { mail_sent: true },
        { mail_verified: true },
      ],
    });
    // console.log("email storage save or not::", storage);
    if (!key) {
      return res.status(404).json({ message: "Unauthorized Access." });
    }
    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found for this email address." });
    }
    if (!storage) {
      return res
        .status(404)
        .json({ message: "No OTP send for this email address." });
    }

    if (!password) {
      return res.status(404).json({ message: "User Password is required." });
    }

    if (storage && storage.name == user.email) {
      // console.log("***********saved otp for user: ", storage.content);
      const filter = { email: email };
      const update = { password: password };
      const options = { new: true };
      const updatedUser = await User.findOneAndUpdate(filter, update, options);
      if (!updatedUser) {
        return res
          .status(404)
          .json({ message: "Internal sever error:Password not changed." });
      }
      res.status(201).json({ message: "Password Changed successfully." });
    } else {
      res.status(401).json({ message: "OTP is not verified yet." });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// method for validating token
async function validateToken(req, res) {
  const authHeader = req.headers.authorization;
  console.log("authHeader::: ", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  console.log("token::: ", token);

  try {
    // Verify the token
    const decoded = jwt.verify(token, "SECRET_KEY");
    console.log("decoded:: ", decoded);

    // Check if the token exists in the database
    const session = await Session.findOne({ userId: decoded.userId, token });
    console.log("session::: ", session);

    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    const user = await User.findOne({ _id: decoded.userId });
    console.log("user:: ", user);

    // Token is valid
    res
      .status(200)
      .json({ message: "Token is valid", userId: decoded.userId, user });
  } catch (err) {
    res.status(401).json({ message: "Token verification failed" });
  }
}

async function deleteUserById(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { user_id, key, id } = decryptedPayload;

    if (!user_id) {
      return res.status(400).json({ message: "User id is required.uc1" });
    }

    if (!key) {
      return res.status(400).json({ message: "Security key not found." });
    }

    if (key !== apiKey) {
      return res
        .status(400)
        .json({ message: "Unauthorized access. Contact to administrator" });
    }
    const existingUser = await User.findOneAndDelete({
      $and: [{ _id: id, userid: user_id }],
    });
    if (existingUser) {
      return res.status(200).json({
        message: "User deleted successfully.",
      });
    }
    res
      .status(404)
      .json({ message: "User not found to delete.Try again after some time." });
  } catch (error) {
    console.error("Error in user delete:", error);
    res.status(500).json({ message: "Internal server error" + error });
  }
}

module.exports = {
  createUser,
  loginUser,
  allUser,
  updateUser,
  forgetPasswordEmailCaputure,
  forgetPasswordEmailOptValidate,
  forgetPasswordChange,
  registrationEmailOptValidate,
  loginAdmin,
  removeloginUser,
  logout,
  logoutAll,
  validateToken,
  deleteUserById,
};
