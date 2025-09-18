const FormBuilder = require("../models/formBuilder");
// const bcrypt = require('bcrypt');
// const Schema = mongoose.Schema;
const Service = require("../services/services");
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;
const apiKey = process.env.API_KEY;
async function getFormbuilderUser(req, res) {
  try {
    // console.log(
    //   "all request parameter: ",
    //   req.body,
    //   " parmas : ",
    //   req.params,
    //   "query",
    //   req.query
    // );
    // console.log("request req.user _id  : ", req.query.user_id);
    // console.log("request req.process _id  : ", req.query.process_id);
    if (req.query.process_id === "") {
      return res
        .status(400)
        .json({ message: "Process id and User id is required." });
    }
    const form = await FormBuilder.find({
      process_id: String(req.query.process_id),
    });
    if (!form || form.length === 0) {
      return res
        .status(404)
        .json({ message: "No form found for this process Id" });
    }
    res.status(201).json({ form });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}
// working code for create form old ==================================
// async function createFormbuilder(req, res) {
//   try {
//     const {
//       form_builder_name,
//       form_builder_detail,
//       formbuilder_data,
//       user_id,
//       process_id,
//     } = req.body;
//     if (process_id === "") {
//       return res.status(400).json({ message: "Process  Id is required." });
//     }
//     if (form_builder_name === "") {
//       return res.status(400).json({ message: "Form  Name is required." });
//     }
//     if (user_id === "") {
//       return res.status(400).json({ message: "User Id is required." });
//     }
//     // Check if the user already exists with the provided email or username
//     const existForm = await FormBuilder.findOne({
//       $or: [{ form_builder_name }],
//     });
//     if (existForm) {
//       return res.status(409).json({
//         error:
//           "Form Name  already exists .Please ensure to enter Unique Form Name.",
//       });
//     }
//     dynamic_form_id = Service.generate_form_key(req.body);
//     const fb_data =
//       formbuilder_data !== null ||
//       formbuilder_data !== "undefined" ||
//       formbuilder_data !== ""
//         ? formbuilder_data
//         : "";

//     const newFormBuilder = new FormBuilder({
//       form_builder_id: dynamic_form_id,
//       form_builder_name,
//       form_builder_detail,
//       formbuilder_data: fb_data,
//       user_id: user_id,
//       process_id: process_id,
//     });

//     await newFormBuilder.save();
//     res.status(201).json({
//       message: "Form created successfully for current user.",
//       formBuilder: newFormBuilder,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error + error });
//   }
// }
// new code for create form new ===================================
async function createFormbuilder(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);

    const {
      form_builder_name,
      form_builder_detail,
      formbuilder_data,
      user_id,
      process_id,
    } = decryptedPayload;
    // const {
    //   form_builder_name,
    //   form_builder_detail,
    //   formbuilder_data,
    //   user_id,
    //   process_id,
    // } = req.body;
    if (process_id === "") {
      return res.status(400).json({ message: "Process  Id is required." });
    }
    if (form_builder_name === "") {
      return res.status(400).json({ message: "Form  Name is required." });
    }
    if (user_id === "") {
      return res.status(400).json({ message: "User Id is required.form builder" });
    }
    // Check if the user already exists with the provided email or username
    const existForm = await FormBuilder.findOne({
      $or: [{ form_builder_name }],
    });
    if (existForm) {
      return res.status(409).json({
        error:
          "Form Name  already exists .Please ensure to enter Unique Form Name.",
      });
    }
    dynamic_form_id = Service.generate_form_key(decryptedPayload);
    // dynamic_form_id = Service.generate_form_key(req.body);
    const fb_data =
      formbuilder_data !== null ||
      formbuilder_data !== "undefined" ||
      formbuilder_data !== ""
        ? formbuilder_data
        : "";

    const newFormBuilder = new FormBuilder({
      form_builder_id: dynamic_form_id,
      form_builder_name,
      form_builder_detail,
      formbuilder_data: fb_data,
      user_id: user_id,
      process_id: process_id,
    });

    await newFormBuilder.save();
    res.status(201).json({
      message: "Form created successfully for current user.",
      formBuilder: newFormBuilder,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error + error });
  }
}
// old working code ==================================================
// async function updateForm(req, res) {
//   try {
//     const { form_builder_id, process_id, formbuilder_data } = req.body;
//     console.log("we are in updateForm data: ", req.body);
//     if (form_builder_id === "") {
//       return res.status(400).json({ message: "Formbuilder Id is required." });
//     }
//     if (process_id === "") {
//       return res
//         .status(400)
//         .json({ message: "Form Attached process Id is required." });
//     }
//     if (formbuilder_data === "") {
//       return res
//         .status(400)
//         .json({ message: "Draw form Json data is required." });
//     }
//     const filter = { process_id: process_id, form_builder_id: form_builder_id };
//     const update = { formbuilder_data: formbuilder_data };
//     const options = { new: true };
//     const updateFormBuilder = await FormBuilder.findOneAndUpdate(
//       filter,
//       update,
//       options
//     );
//     if (!updateFormBuilder) {
//       return res
//         .status(404)
//         .json({ message: "Process Specefic Form not found." });
//     }
//     res.status(201).json({
//       message: "Form data  Updated successfully with process Id.",
//       updateFormBuilder,
//     });
//   } catch (message) {
//     res.status(500).json({ error: "Internal server error ." + error });
//   }
// }
// new code for form update ===========================================
async function updateForm(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { form_builder_id, process_id, formbuilder_data } = decryptedPayload;
    // const { form_builder_id, process_id, formbuilder_data } = req.body;
    // console.log("we are in updateForm data: ", decryptedPayload);
    // console.log("we are in updateForm data: ", req.body);
    if (form_builder_id === "") {
      return res.status(400).json({ message: "Formbuilder Id is required." });
    }
    if (process_id === "") {
      return res
        .status(400)
        .json({ message: "Form Attached process Id is required." });
    }
    if (formbuilder_data === "") {
      return res
        .status(400)
        .json({ message: "Draw form Json data is required." });
    }
    const filter = { process_id: process_id, form_builder_id: form_builder_id };
    const update = { formbuilder_data: formbuilder_data };
    const options = { new: true };
    const updateFormBuilder = await FormBuilder.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateFormBuilder) {
      return res
        .status(404)
        .json({ message: "Process Specefic Form not found." });
    }
    res.status(201).json({
      message: "Form data  Updated successfully with process Id.",
      updateFormBuilder,
    });
  } catch (message) {
    res.status(500).json({ error: "Internal server error ." + error });
  }
}

async function formDelete(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { process_id, form_builder_id } = decryptedPayload;
    // const { process_id, form_builder_id } = req.body;
    // console.log("we are in formbuilder delete controller: ", decryptedPayload);
    // console.log("we are in formbuilder delete controller: ", req.body);
    const filter = { process_id: process_id, form_builder_id: form_builder_id };
    const result = await FormBuilder.deleteOne(filter);
    if (result.deletedCount === 1) {
      // console.log("Successfully deleted one Form data.");
      res
        .status(201)
        .json({ message: "Specefied process Form is deleted.", result });
    } else {
      console.log("No Form matched the query. Deleted 0 Form.");
      res
        .status(201)
        .json({ message: "No Form matched . Deleted 0 Form.", result });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// method to delete all formbuider from the collection that is related to process id and when process is deleted..
async function deleteAllFormBuilders(processId) {
  try {
    // console.log("we are in delete form when delete process", processId);
    const filter = { process_id: processId };
    const result = await FormBuilder.deleteMany(filter);
    console.log(`${result.deletedCount} FormBuilders deleted.`);
    return result.deletedCount;
  } catch (error) {
    // console.error("Error deleting all form builders:", error);
    throw new Error("Internal server error");
  }
}

// Method to delete all form documents with matching user_id and process_id
async function deleteFormsByUserAndProcess(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { user_id, process_id, apikey: providedApiKey } = decryptedData;

    // Validate the input fields
    if (!user_id) {
      return res.status(400).json({ message: "User id required." });
    }
    // Validate the input fields
    if (!process_id) {
      return res.status(400).json({ message: "Process id is required." });
    }

    if (providedApiKey !== apiKey) {
      return res
        .status(403)
        .json({ message: "Unauthorized access. Invalid API key." });
    }

    // Delete all documents that match the given user_id and process_id
    const deletedForms = await FormBuilder.deleteMany({
      user_id: user_id,
      process_id: process_id,
    });

    if (deletedForms.deletedCount === 0) {
      return res.status(404).json({
        message: "No forms found with the provided user_id and process_id.",
      });
    }

    res.status(200).json({
      message: "All forms deleted successfully.",
      deletedCount: deletedForms.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting forms:", error);
    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
}

// cotroller to update formbuilder kanban view data start here
async function updateFormKanban(req, res) {
  try {
    const { form_builder_id, process_id, kanban_data } = req.body;
    // console.log("we are in updateForm data kanban data: ", req.body);
    if (form_builder_id === "") {
      return res.status(400).json({ message: "Formbuilder Id is required." });
    }
    if (process_id === "") {
      return res
        .status(400)
        .json({ message: "Form Attached process Id is required." });
    }
    // if (kanban_data === "") {
    //   return res
    //     .status(400)
    //     .json({ error: "Kanban data  is required." });
    // }
    const filter = { process_id: process_id, form_builder_id: form_builder_id };
    const update = { kanban_data: kanban_data };
    const options = { new: true };
    const updateFormBuilder = await FormBuilder.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateFormBuilder) {
      return res
        .status(404)
        .json({ message: "Process Specefic Form not found." });
    }
    res.status(201).json({
      message: "Form data  Updated successfully with process Id.",
      updateFormBuilder,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}
// end here
// starrt controller for fetch only kanban data via process Id and  form id:
async function getKanbanView(req, res) {
  try {
    // console.log(
    //   "all request parameter: ",
    //   req.body,
    //   " parmas : ",
    //   req.params,
    //   "query",
    //   req.query
    // );
    // console.log("request req.user _id  : ", req.query.user_id);
    // console.log("request req.form_id  : ", req.query.form_id);
    if (req.query.form_id === "" || req.query.form_id === undefined) {
      return res.status(400).json({ message: "Form Id  is required." });
    }

    const form = await FormBuilder.find(
      { form_builder_id: String(req.query.form_id) },
      { kanban_data: 1, _id: 0 }
    );
    if (!form || form.length === 0) {
      return res
        .status(404)
        .json({ message: "No form found for this Form Id" });
    }

    const kanban = form.filter((form) => form.kanban_data);
    var kanban_data = kanban[0].kanban_data;
    console.log(" form data : ", kanban_data[0].kanban_data);
    res.status(201).json({ kanban_data });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}
// end here

// method for updating related field model status
async function updateFormInnerElement(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { form_builder_id, process_id } = decryptedPayload;
    if (!process_id) {
      return res.status(400).json({ message: "Process  Id is required." });
    }

    if (!form_builder_id) {
      return res.status(400).json({ message: "Form Id is required." });
    }
    const existForm = await FormBuilder.findOne({
      $or: [{ form_builder_id }],
    });
    if (existForm) {
      console.log("fdfddfgg", existForm.formbuilder_data);
      update_data = Service.handleUpdateRelatedModelStatus(
        existForm.formbuilder_data
      );
      existForm.formbuilder_data = update_data;
      console.log(" ne u dpaea da;", existForm.formbuilder_data);
      const filter = { form_builder_id };
      const update = { formbuilder_data: existForm.formbuilder_data };
      const options = { new: true };
      const updateFormBuilder = await FormBuilder.findOneAndUpdate(
        filter,
        update,
        options
      );

      res.status(201).json({ message: "Updated successfully." });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error + error });
  }
}

module.exports = {
  createFormbuilder,
  getFormbuilderUser,
  updateForm,
  formDelete,
  deleteAllFormBuilders,
  updateFormKanban,
  getKanbanView,
  updateFormInnerElement,
  deleteFormsByUserAndProcess,
};
