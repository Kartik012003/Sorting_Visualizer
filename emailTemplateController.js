const emailTemplate = require("../models/emailTemplate");
const Service = require("../services/services");

const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;

// async function fetchEmail(req, res) {
//    try {
//         const { user_id, process_id , key} = req.body;
//         if (!user_id) {
//             return res.status(400).json({ message: 'User Id is required.' });
//         }

//         if (!key) {
//             return res.status(400).json({ message: 'Access Key  is required.' });
//             }

//         if (key!=apiKey) {
//             return res.status(400).json({ message: 'Unauthorized access User .Contact to administrator.' });
//             }

//         const existMailTemplate = await emailTemplate.find({ $and: [{ user_id,process_id }] });
//         console.log("*** mail template avail ", existMailTemplate)
//         if (existMailTemplate) {
//             return res.status(201).json({ message: existMailTemplate});
//         }
//         return res.status(404).json({ message: null});
//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error' + error });
//     }
// }

// old working code ===============================================================
// async function fetchEmail(req, res) {
//   try {
//     const { user_id, key } = req.body;
//     if (!user_id) {
//       return res.status(400).json({ message: "User Id is required." });
//     }

//     if (!key) {
//       return res.status(400).json({ message: "Access Key  is required." });
//     }

//     if (key != apiKey) {
//       return res.status(400).json({
//         message: "Unauthorized access User .Contact to administrator.",
//       });
//     }

//     const existMailTemplate = await emailTemplate.find(
//       { user_id: String(user_id) },
//       {
//         user_id: 1,
//         template_name: 1,
//         mail_to: 1,
//         mail_from: 1,
//         mail_subject: 1,
//         mail_body: 1,
//         mail_trigger: 1,
//         mail_limit: 1,
//       }
//     );
//     console.log("*** mail template avail ", existMailTemplate);
//     if (existMailTemplate) {
//       return res.status(201).json({
//         emails: existMailTemplate,
//         message: "Email fetched successfully.",
//       });
//     }
//     return res.status(404).json({ message: "Email template does not exist" });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for email fetch ======================================================
async function fetchEmail(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    // console.log("decryptedData for email fetch request:", decryptedData);

    const { user_id, key } = decryptedData;
    // const { user_id, key } = req.body;
    if (
      !user_id ||
      [undefined, null, "null", "undefined", ""].includes(user_id)
    ) {
      return res.status(400).json({ message: "User Id is required.E1" });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }

    const existMailTemplate = await emailTemplate.find(
      { user_id: String(user_id) },
      {
        database: 1,
        user_id: 1,
        template_name: 1,
        mail_to: 1,
        mail_from: 1,
        mail_subject: 1,
        mail_body: 1,
        mail_trigger: 1,
        mail_limit: 1,
      }
    );
    // console.log("*** mail template avail ", existMailTemplate);
    if (existMailTemplate) {
      return res.status(201).json({
        emails: existMailTemplate,
        message: "Email fetched successfully.",
      });
    }
    return res.status(404).json({ message: "Email template does not exist" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}
//  get process via user id and process id
// old working code ==============================================================
// async function fetchOneEmail(req, res) {
//   try {
//     const { email_id, user_id, key } = req.body;
//     console.log("full request body: ", req.body);
//     if (!user_id) {
//       return res.status(400).json({ message: "User Id is required." });
//     }

//     if (!email_id) {
//       return res.status(400).json({ message: "Process Id is required." });
//     }
//     if (!key) {
//       return res.status(400).json({ message: "Access Key  is required." });
//     }

//     if (key != apiKey) {
//       return res.status(400).json({
//         message: "Unauthorized access User .Contact to administrator.",
//       });
//     }

//     const email = await emailTemplate.findOne({
//       $and: [{ user_id, _id: email_id }],
//     });
//     if (!email) {
//       return res.status(404).json({ message: "Email not found." });
//     }
//     res.status(201).json({ email });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for fetching on email ===============================================
async function fetchOneEmail(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email_id, user_id, key } = decryptedPayload;
    // const { email_id, user_id, key } = req.body;
    // console.log("full request body: ", decryptedPayload);
    // console.log("full request body: ", req.body);
    if (
      !user_id ||
      [undefined, null, "null", "undefined", ""].includes(user_id)
    ) {
      return res.status(400).json({ message: "User Id is required.E2" });
    }

    if (
      !email_id ||
      [undefined, null, "null", "undefined", ""].includes(email_id)
    ) {
      return res.status(400).json({ message: "Email Id is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access. Contact to administrator.",
      });
    }

    const email = await emailTemplate.findOne({
      $and: [{ user_id, _id: email_id }],
    });
    if (!email) {
      return res.status(404).json({ message: "Email not found." });
    }
    res.status(201).json({ email });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function createEmail(req, res) {
  // console.log(" ***** create email template req.body : ", req.body);
  // console.log(" ***** create email template req.file : ", req.files);
  // console.log(" ***** create email template :req.file[0].buffer ", req.file[0].buffer)
  // console.log(" ***** create email template :req.file[1].buffer ", req.file[1].buffer)
  try {
    const {
      database,
      user_id,
      process_id,
      node_id,
      template_name,
      mail_to,
      mail_from,
      mail_subject,
      mail_body,
      attachment_type,
      attachment_file,
      mail_trigger,
      mail_limit,
      key,
    } = req.body;
    if (
      !user_id ||
      [undefined, null, "null", "undefined", ""].includes(user_id)
    ) {
      return res.status(400).json({ message: "User Id is required.E3" });
    }
    if (database === "null") {
      return res.status(400).json({ message: "Hutch is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }

    const existMailTemplate = await emailTemplate.find({
      $and: [{ user_id, template_name }],
    });
    // console.log("*** mail template avail in create ", existMailTemplate);
    if (existMailTemplate.length > 0) {
      console.log(" yes email is exist block resturn");
      return res
        .status(409)
        .json({ message: "Email Template already defined." });
    }
    // const newEmailTemplate = new emailTemplate({ user_id,process_id,node_id,template_name,mail_to,mail_from,mail_subject,mail_body,attachment_type,attachment_file,mail_trriger,mail_limit});

    let fileBuffers;
    if (!req.body.files || req.body.files.length > 0) {
      fileBuffers = req.files.map((file) => file.buffer);
    }
    // console.log(" we are in email buddonfline  :", fileBuffers);
    // Create a new email template document
    const newEmailTemplate = new emailTemplate({
      database: req.body.database,
      user_id: req.body.user_id,
      process_id: req.body.process_id,
      node_id: req.body.node_id,
      template_name: req.body.template_name,
      mail_to: req.body.mail_to,
      mail_from: req.body.mail_from,
      mail_subject: req.body.mail_subject,
      mail_body: req.body.mail_body,
      attachment_type: req.body.attachment_type,
      attachment_file: fileBuffers,
      mail_trigger: req.body.mail_trigger,
      mail_limit: req.body.mail_limit,
    });

    await newEmailTemplate.save();
    console.log("file is saved in email template;:", newEmailTemplate);
    res.status(201).json({
      message: "Email template created successfully",
      emailTemplate: newEmailTemplate,
    });
  } catch (error) {
    console.log(" ufffff :", error);
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function allNodeAction(req, res) {
  try {
    const actions = await NodeAction.find();
    if (!actions) {
      return res.status(404).json({ message: "NO Node Action found" });
    }
    res.status(201).json({ message: "All Nodes Action", actions });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function updateEmail(req, res) {
  try {
    const {
      database,
      email_id,
      user_id,
      process_id,
      node_id,
      template_name,
      mail_to,
      mail_from,
      mail_subject,
      mail_body,
      attachment_type,
      attachment_file,
      mail_trigger,
      mail_limit,
      key,
    } = req.body;

    if (
      !user_id ||
      [undefined, null, "null", "undefined", ""].includes(user_id)
    ) {
      return res.status(400).json({ message: "User Id is required.E4" });
    }

    if (database === "null") {
      return res.status(400).json({ message: "Hutch is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (
      !email_id ||
      [undefined, null, "null", "undefined", ""].includes(email_id)
    ) {
      return res.status(400).json({ message: "email Id is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }
    const filter = { _id: email_id };
    let fileBuffers;

    if (!req.body.files || req.body.files.length > 0) {
      fileBuffers = req.files.map((file) => file.buffer);
    }
    // console.log(" we are in email buddonfline  :", fileBuffers);
    // Create a new email template document
    const update = {
      database: req.body.database,
      user_id: req.body.user_id,
      process_id: req.body.process_id,
      node_id: req.body.node_id,
      template_name: req.body.template_name,
      mail_to: req.body.mail_to,
      mail_from: req.body.mail_from,
      mail_subject: req.body.mail_subject,
      mail_body: req.body.mail_body,
      attachment_type: req.body.attachment_type,
      attachment_file: fileBuffers,
      mail_trigger: req.body.mail_trigger,
      mail_limit: req.body.mail_limit,
    };
    // const update = { user_id,process_id,node_id,template_name,mail_to,mail_from,mail_subject,mail_body,attachment_type,attachment_file,mail_trriger,mail_limit}
    const options = { new: true };
    const updateEmail = await emailTemplate.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateEmail) {
      return res
        .status(404)
        .json({ message: "Email template is not found to update." });
    }
    res.status(201).json({
      message: "Email template Updated successfully with data flow.",
      emailTemplate: updateEmail,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// old working code ================================================================
// async function deleteEmail(req, res) {
//   try {
//     const { email_id, user_id, key } = req.body;
//     if (!user_id) {
//       return res.status(400).json({ message: "User Id is required." });
//     }

//     if (!key) {
//       return res.status(400).json({ message: "Access Key  is required." });
//     }

//     if (!email_id) {
//       return res.status(400).json({ message: "Email id is required." });
//     }

//     if (key != apiKey) {
//       return res.status(400).json({
//         message: "Unauthorized access User .Contact to administrator.",
//       });
//     }
//     const filter = { _id: email_id };
//     const result = await emailTemplate.deleteOne(filter);
//     if (result.deletedCount === 1) {
//       res
//         .status(201)
//         .json({ message: "Specefied email template  is deleted.", result });
//     } else {
//       res
//         .status(400)
//         .json({ message: "NO Email template matched . Deleted 0 .", result });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for delete email template ==============================================
async function deleteEmail(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { email_id, user_id, key } = decryptedPayload;
    // const { email_id, user_id, key } = req.body;
    if (
      !user_id ||
      [undefined, null, "null", "undefined", ""].includes(user_id)
    ) {
      return res.status(400).json({ message: "User Id is required.E5" });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (
      !email_id ||
      [undefined, null, "null", "undefined", ""].includes(email_id)
    ) {
      return res.status(400).json({ message: "Email id is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }
    const filter = { _id: email_id };
    const result = await emailTemplate.deleteOne(filter);
    if (result.deletedCount === 1) {
      res
        .status(201)
        .json({ message: "Specefied email template  is deleted.", result });
    } else {
      res
        .status(400)
        .json({ message: "NO Email template matched . Deleted 0 .", result });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// fetching attachment for the email sending time
async function fetchEmailObj(req, res) {
  try {
    const { id, key } = req.body;
    if (!id || [undefined, null, "null", "undefined", ""].includes(id)) {
      return res.status(400).json({ message: "Object Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }

    const existMailTemplate = await emailTemplate.find({ $and: [{ _id: id }] });
    console.log("*** mail template avail ", existMailTemplate);
    if (existMailTemplate) {
      return res.status(201).json({ message: existMailTemplate });
    }
    return res.status(404).json({ message: null });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

module.exports = {
  fetchEmail,
  fetchOneEmail,
  createEmail,
  deleteEmail,
  updateEmail,
  fetchEmailObj,
};
