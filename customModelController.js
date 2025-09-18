const CustomModel = require("../models/customModel");
const UserConfig = require("../models/userConfig");
const CustomModelField = require("../models/customModelField");
const Service = require("../services/services");
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;
const XLSX = require("xlsx");

// Method to fetch all custom models
async function fetchCustomModels(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { key, user_id } = decryptedData;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmc1" });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const models = await CustomModel.find({ user_id });
    res
      .status(200)
      .json({ message: "All models fetched successfully.", models });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Method to fetch a single custom model by ID
async function fetchCustomModelById(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { model_id, key, user_id } = decryptedData;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmc2" });
    }

    if (!model_id) {
      return res.status(400).json({ message: "Model ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const model = await CustomModel.findById(model_id);
    if (!model) {
      return res.status(404).json({ message: "Model not found." });
    }

    res.status(200).json({ message: "Model fetched successfully.", model });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// Method to create a new custom model

async function createCustomModel(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { name, model, key, user_id, model_fields, allow_duplicate, database } =
      decryptedData;
      console.log("decryptedData: ", decryptedData);
      console.log("allow_duplicate: ", allow_duplicate);
      

    // Check if user_id exists
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmc3" });
    }

    // Check if model name exists
    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    // Check API key validity
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // ===============santosh code======================
    const end_point = "/o2b/create/model";
    const filter = { _id: database, userid: user_id };
    const existConfig = await UserConfig.find({ $and: [filter] });
    console.log("existConfig:: ", existConfig);

    if (existConfig && existConfig[0].parameter) {
      const apiUrl = existConfig[0].parameter + end_point;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(decryptedData),
      });
      // Handle API response
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log(" *** line error data : ", data)
      console.log(" *** JSON.parse(data.result)", JSON.parse(data.result))
      const { message, code, model_id, model_name } = JSON.parse(data.result);
      console.log("Module response data data.result.code====:", model_id);
      if (code === "200") {
        const newModel = new CustomModel({
          id: model_id,
          name: name,
          model: model_name,
          user_id,
          model_fields,
          allow_duplicate,
          database: `${existConfig[0].configname} (${existConfig[0].database})`,
          database_obj: existConfig[0]._id,
          database_url: existConfig[0].parameter,
        });
        const savedModel = await newModel.save();
        res.status(201).json({
          message: "Model created successfully along with the default field.",
          model: savedModel,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
}


// old

// Method to update a custom model by ID
async function updateCustomModel(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { model_id, name, model, key, user_id, model_fields, allow_duplicate } =
      decryptedData;

    console.log(" upate model field api request : ", decryptedData);

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmc5" });
    }

    if (!model_id) {
      return res.status(400).json({ message: "Model ID is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const modelData = await CustomModel.findById(model_id);
    if (!modelData) {
      return res.status(404).json({ message: "Model not found." });
    }

    modelData.name = name || modelData.name;
    modelData.model = model || modelData.model;
    modelData.allow_duplicate = allow_duplicate || modelData.allow_duplicate;
    modelData.model_fields = model_fields || modelData.model_fields;
    const updatedModel = await modelData.save();

    console.log(" ** model data : ", modelData);

    // udpate all field in odoo backend while update in react ui
    const end_point = "/o2b/create/model";
    if (modelData && modelData.database_url) {
      const apiUrl = modelData.database_url + end_point;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(decryptedData),
      });
      // Handle API response
      if (!response.ok) {
        console.log(
          " error while calling odoo backend api that create model or its fields"
        );
      }
    }
    // udpate all field in odoo backend while update in react ui
    res
      .status(200)
      .json({ message: "Model updated successfully.", model: updatedModel });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
}

// oldddddddddddddddddddddddddddddd
// enddddddd

// Method to delete a custom model by ID
// async function deleteCustomModel(req, res) {
//   try {
//     const encryptedData = req.body.data;
//     const decryptedData = Service.decryptData(encryptedData, payloadSecret);
//     const { model_id, key, user_id } = decryptedData;

//     if (!user_id) {
//       return res.status(400).json({ message: "User ID is required." });
//     }

//     if (!model_id) {
//       return res.status(400).json({ message: "Model ID is required." });
//     }

//     if (!key) {
//       return res.status(400).json({ message: "Access Key is required." });
//     }

//     if (key !== apiKey) {
//       return res.status(401).json({ message: "Unauthorized access." });
//     }

//     const deletedModel = await CustomModel.findByIdAndDelete(model_id);
//     if (!deletedModel) {
//       return res.status(404).json({ message: "Model not found." });
//     }

//     res
//       .status(200)
//       .json({ message: "Model deleted successfully.", model: deletedModel });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error.", error: error.message });
//   }
// }
async function deleteCustomModel(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedData = Service.decryptData(encryptedData, payloadSecret);
    const { model_id, key, user_id } = decryptedData;

    // Check if user_id exists
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required.cmc" });
    }

    // Check if model_id exists
    if (!model_id) {
      return res.status(400).json({ message: "Model ID is required." });
    }

    // Check API key validity
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key !== apiKey) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // Find and delete the custom model
    const modelToDelete = await CustomModel.findOne({ _id: model_id, user_id });

    if (!modelToDelete) {
      return res
        .status(404)
        .json({ message: "Model not found or unauthorized access." });
    }

    await CustomModel.deleteOne({ _id: model_id });

    // Delete all fields related to the model
    await CustomModelField.deleteMany({ model_id });

    // Respond with success
    res
      .status(200)
      .json({ message: "Model and its related fields deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
}

// *************** model code API started here *******//

// model field creation api
async function modelFieldCreation(req, res) {
  try {
    // const encryptedData = req.body.data;
    // const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    // const { configid, userid, key } = decryptedPayload;
    console.log(" fulllu8 rquest body in mdel createion ", req.body);
    const { key, database_url, database, modelDetail, fields } = req.body;
    // Validation checks

    if (!database_url) {
      return res.status(400).json({ message: "Database Url is required." });
    }
    if (!modelDetail) {
      return res.status(400).json({ message: "Model Detail is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access. User contact to administrator.",
      });
    }

    console.log("key, model detail ", key, modelDetail, fields);
    const end_point = "/post/data/model";
    const odooApiUrl = database_url + end_point;
    console.log(" *** requesting url ", odooApiUrl);
    const odooRequestBody = {
      modelDetail: modelDetail,
      fields: fields,
      username: "o2b_user",
    };
    const headers = {
      "Content-Type": "application/json",
      "X-Security-Key": key,
    };
    console.log(" ** my request body: ", odooRequestBody);
    const response = await fetch(odooApiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(odooRequestBody),
    });
    // console.log(" *** full reponse of authenticate odoo user; ", response);
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({
        message: "Failed to authenticate with Server",
        error: errorData,
      });
    }
    const data = await response.json();
    console.log("Odoo response:", data);
    const {message,code} = JSON.parse(data.result)
    if(code == 201)
    {
      return res.status(201).json({ message: message, code : code });
    }
    if(code == 409)
    {
       return res.status(404).json({ message: message, code : code });
    }
   
  } catch (error) {
    console.log(" ****error ", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

//  ** model fields fetch api
async function modelFieldFetch(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    // const { configid, userid, key } = decryptedPayload;
    // console.log(" fulllu8 rquest body in mdel createion ", req.body)
    // const { key, database_url,database, modelDetail,fields } = req.body;
    const { key, database_url, database, modelDetail, fields } =
      decryptedPayload;
    // Validation checks

    if (!database_url) {
      return res.status(400).json({ message: "Database Url is required." });
    }
    if (!modelDetail) {
      return res.status(400).json({ message: "Model Detail is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access. User contact to administrator.",
      });
    }

    console.log("key, model detail ", key, modelDetail, fields);
    const end_point = "/post/data/model/field/fetch";
    const odooApiUrl = database_url + end_point;
    console.log(" *** requesting url ", odooApiUrl);
    const odooRequestBody = {
      modelDetail: modelDetail,
      fields: fields,
      username: "o2b_user",
    };
    const headers = {
      "Content-Type": "application/json",
      "X-Security-Key": key,
    };
    console.log(" ** my request body: ", odooRequestBody);
    const response = await fetch(odooApiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(odooRequestBody),
    });
    // console.log(" *** full reponse of authenticate odoo user; ", response);
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({
        message: "Failed to authenticate with Server",
        error: errorData,
      });
    }
    const data = await response.json();
    console.log("Odoo response:", data);
    const { message } = data.result;
    return res
      .status(201)
      .json({ message: "Record Fetch successfully.", records: message });
  } catch (error) {
    console.log(" ****error ", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// *** delete model field value
//  ** model fields fetch api
async function modelFieldDelete(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    // const { configid, userid, key } = decryptedPayload;
    // console.log(" fulllu8 rquest body in mdel createion ", req.body);
    const { key, database_url, database, modelDetail, fields } =
      decryptedPayload;
    // const { key, database_url, database, modelDetail, fields } = req.body;
    // Validation checks

    if (!database_url) {
      return res.status(400).json({ message: "Database Url is required." });
    }
    if (!modelDetail) {
      return res.status(400).json({ message: "Model Detail is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access. User contact to administrator.",
      });
    }

    console.log("key, model detail ", key, modelDetail, fields);
    const end_point = "/post/data/model/field/delete";
    const odooApiUrl = database_url + end_point;
    console.log(" *** requesting url ", odooApiUrl);
    const odooRequestBody = {
      modelDetail: modelDetail,
      fields: fields,
      username: "o2b_user",
    };
    const headers = {
      "Content-Type": "application/json",
      "X-Security-Key": key,
    };
    console.log(" ** my request body: ", odooRequestBody);
    const response = await fetch(odooApiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(odooRequestBody),
    });
    // console.log(" *** full reponse of authenticate odoo user; ", response);
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({
        message: "Failed to authenticate with Server",
        error: errorData,
      });
    }
    const data = await response.json();
    console.log("Odoo response:", data);
    const { message } = data.result;
    return res.status(201).json({ message: message });
  } catch (error) {
    console.log(" ****error ", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// *** file upload of csv or xls file upload api to create bulk records
async function modelCreateFeildFileUpload(req, res) {
  try {
    // const encryptedData = req.body.data;
    // const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    // // const { configid, userid, key } = decryptedPayload;
    // // console.log(" fulllu8 rquest body in mdel createion ", req.body);
    // const { key, database_url, database, modelDetail, fields } =
    //   decryptedPayload;
    console.log(" *** file upload complete request : ", req.body)
    console.log(" *** file upload complete request : ", req.file.buffer)
    const { key, database_url,model_id } = req.body;
    // Validation checks
    
    if (!database_url) {
      return res.status(400).json({ message: "Database Url is required." });
    }
    if (!model_id) {
      return res.status(400).json({ message: "Model Id is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access. User contact to administrator.",
      });
    }

    if (!req.file) {
        return res.status(400).json({ message: "Please Upload a valid file." });
    }

    // Parse the buffer using xlsx
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(" *************** sheet name data : ", sheetName)
    console.log(" *************** sheet data : ", sheetData)

    const end_point = "/post/data/model/field/upload";
    const odooApiUrl = database_url + end_point;
    console.log(" *** requesting url ", odooApiUrl);
    const modelDetail = {
      model_id: model_id
    }
    const odooRequestBody = {
      modelDetail: modelDetail,
      fileData: sheetData,
      username: "o2b_user",
    };
    const headers = {
      "Content-Type": "application/json",
      "X-Security-Key": key,
    };
    console.log(" ** my request body: ", odooRequestBody);
    const response = await fetch(odooApiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(odooRequestBody),
    });
    // console.log(" *** full reponse of authenticate odoo user; ", response);
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({
        message: "Failed to authenticate with Server",
        error: errorData,
      });
    }
    const data = await response.json();
    const { message ,code} = data.result;
    console.log("Odoo response:", data);
    console.log("Odoo response: message ", message, " code  :", code);
    if(code == 201)
    {
      return res.status(201).json({ message: message });
    }
    if(code == 401)
    {
      return res.status(401).json({ message: message });
    }
  } catch (error) {
    console.log(" ****error ", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}
// *** file upload of csv or xls file upload api to create bulk records

// *************** model code API started here *******//

module.exports = {
  fetchCustomModels,
  fetchCustomModelById,
  createCustomModel,
  updateCustomModel,
  deleteCustomModel,
  modelFieldCreation,
  modelFieldFetch,
  modelFieldDelete,
  modelCreateFeildFileUpload,
};
