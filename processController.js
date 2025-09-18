const Process = require("../models/process");
const Subscription = require("../models/subscription");
// const bcrypt = require('bcrypt');
// const Schema = mongoose.Schema;
const Service = require("../services/services");
const FormBuilderController = require("../controllers/formBuilderController");
const FormBuilder = require("../models/formBuilder");
const UserConfig = require("../models/userConfig");
const User = require("../models/user");
const emailTemplate = require("../models/emailTemplate");
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;
const baseUrl = process.env.ODOO_BASE_URL;
const apiKey = process.env.API_KEY;
const Decision = require("../models/processDecision_table");
// new get base url:
const decisionUrl = process.env.DECISION_URL;
const Temp = require("../models/tempData");
const CustomModel = require("../models/customModel");
const axios = require('axios');



// console.log(" baase url: ", baseUrl)
// console.log(" apiKey: ", apiKey)const multer = require('multer');
// const multer = require('multer');
// Use memory storage to keep file data in memory
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// get all process via user id
async function getProcessesByUserId(req, res) {
  try {
    const { user_id } = req.params; // Assuming user_id is passed as a URL parameter
    if (!user_id) {
      return res.status(400).json({ message: "User Id is required." });
    }

    const processes = await Process.find({ user_id: String(user_id) });
    if (!processes || processes.length === 0) {
      return res
        .status(404)
        .json({ message: "No processes found for this user" });
    }
    res.status(201).json({ processes });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}


//  get process via user id and process id
async function getProcessesByProcessIdUserId(req, res) {
  try {
    const { process_id, user_id } = req.body;
    // console.log("full request body: ", req.body);
    if (!user_id) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!process_id) {
      return res.status(400).json({ message: "Process Id is required." });
    }

    const processes = await await Process.findOne({
      $and: [{ user_id, process_id }],
    });
    if (!processes) {
      return res.status(404).json({ message: "Process not found." });
    }
    res.status(201).json({ processes });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function createProcess(req, res) {
  try {
    console.log(" baase url: ", baseUrl);
    console.log(" apiKey: ", apiKey);
    console.log("ssssssssss req : ", req);
    console.log("create process full req body: : ", req.body);
    // console.log("uuuuuuuuuuuuuuu req.file", req.file)
    const {
      process_database,
      process_group,
      process_group_category,
      process_name,
      process_detail,
      user_id,
      midurl,
    } = req.body;
    if (process_name === "") {
      return res.status(400).json({ message: "Process Name is required." });
    }
    if (user_id === "") {
      return res.status(400).json({ message: "User Id is required." });
    }
    // find configurration and update process table for colum process database obj and name
    const existConfig = await UserConfig.findOne({
      $and: [
        { userid: user_id },
        { _id: process_database.trim() },
        { isactive: true },
      ],
    });
    console.log("Existing configuration: ", existConfig);
    if (!existConfig) {
      return res.status(400).json({ message: "Configuration is not active" });
    }

    // Check if the user already exists with the provided email or username
    const existProcess = await Process.findOne({ $or: [{ process_name }] });
    if (existProcess) {
      // console.log("existing user : ", existProcess);
      return res.status(409).json({
        message:
          "Process already exists .Please ensure to enter Process Name unique.",
      });
    }
    let database_name = existConfig.configname + " (" + existConfig.database + ")";
    let midUrl = existConfig.midurl;
    if (!midUrl || existConfig.midurl) {
      midUrl = decisionUrl;
    }
    dynamic_process_id = Service.generate_process_key(req.body);
    let newProcess;
    if (req.file) {
      newProcess = new Process({
        process_id: dynamic_process_id,
        process_group,
        process_group_category,
        process_name: process_name.trim(),
        process_detail,
        user_id,
        process_data_flow: "",
        process_data_form: "",
        process_image: req.file.buffer,
        database: database_name,
        database_obj: existConfig._id,
        database_url: existConfig.parameter,
        midurl: midUrl,
        odoo_version: existConfig.odoo_version,
        environment_type :existConfig.databasetype,
      });
    } else {
      newProcess = new Process({
        process_id: dynamic_process_id,
        process_group,
        process_group_category,
        process_name,
        process_detail,
        user_id,
        process_data_flow: "",
        database: database_name,
        database_obj: existConfig._id,
        database_url: existConfig.parameter,
        midurl: midUrl,
        odoo_version: existConfig.odoo_version,
        environment_type :existConfig.databasetype
      });
    }
    await newProcess.save();
    res
      .status(201)
      .json({ message: "Process created successfully", process: newProcess });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function updateProcess(req, res) {
  try {
    const { process_id, user_id } = req.body;
    // console.log("full request body: ", req.body);

    if (!user_id) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!process_id) {
      return res.status(400).json({ message: "Process Id is required." });
    }

    const filter = { process_id: process_id, user_id: user_id };
    const update = {
      process_data_flow: req.body.process_data_flow,
      process_data_form: req.body.process_data_form,
    };
    const options = { new: true };
    const updateProcess = await Process.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateProcess) {
      return res.status(404).json({ message: "Process not found." });
    }
    res.status(201).json({
      message: "Process Updated successfully with data flow.",
      updateProcess,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function updateProcessStatus(req, res) {
  try {
    const { process_id, user_id } = req.body;
    // console.log("full request body in publish and unpublish: ", req.body);
    // write code for publish an unpublished in odoo backend
    // const processes = await Process.find({user_id: String(user_id)},{process_id: process_id});
    const processes = await Process.findOne({
      $and: [{ process_id }, { user_id }],
    });
    if (!processes || processes.length === 0) {
      return res
        .status(404)
        .json({ message: "No process detail found for this process id." });
    }
    // console.log("******* updateProcessStatus : ", processes.process_name);
    let url = processes.database_url;
    if (!url) {
      return res.status(401).json({
        message: "No Hutch bind to this process.Please check.",
        code: 401,
      });
    }
    // console.log("publish url : ", url);
    let end_point;
    let apiUrl;
    let data;
    let response;
    const key = "o2b_technologies";
    if (req.body.status) {
      // console.log("we active stausl ", req.body.status);
      end_point = "/process/publish/status/change/active";
      apiUrl = `${url}${end_point}?key=${encodeURIComponent(
        key
      )}&name=${encodeURIComponent(
        processes.process_name
      )}&status=${encodeURIComponent(req.body.status)}`;
      // console.log("==================Connection URL=======================: ", apiUrl);
      response = await fetch(apiUrl);
      response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      data = await response.json();
      // console.log("Connection successful:", data);
      if (data.code === "401") {
        return res.status(401).json({ message: data.message, code: 401 });
      }
    } else {
      // console.log("inactive statrus; ", req.body.status);
      end_point = "/process/publish/status/change/inactive";
      apiUrl = `${url}${end_point}?key=${encodeURIComponent(
        key
      )}&name=${encodeURIComponent(
        processes.process_name
      )}&status=${encodeURIComponent(req.body.status)}`;
      console.log("Connection URL========: ", apiUrl);
      response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      data = await response.json();
      // console.log("Connection successful:", data);
      if (data.code === "401") {
        return res.status(401).json({ message: data.message, code: 401 });
      }
    }

    // write code for publish an unpublished in odoo backend
    const filter = { process_id: process_id, user_id: user_id };
    const update = { odoo_checking_status: req.body.status };
    const options = { new: true };
    const updateProcess = await Process.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateProcess) {
      return res.status(404).json({ message: "Process not found." });
    }
    res.status(201).json({ message: data.message, updateProcess });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function updateProcessModuleStatus(req, res) {
  try {
    const { process_id, user_id } = req.body;
    // console.log("full request body: updateProcessModuleStatus", req.body);

    if (!user_id) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!process_id) {
      return res.status(400).json({ message: "Process Id is required." });
    }

    const filter = { process_id: process_id, user_id: user_id };
    const update = { is_module_created: req.body.status };
    const options = { new: true };
    const updateProcess = await Process.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateProcess) {
      return res.status(404).json({ message: "Process not found." });
    }
    res.status(201).json({
      message: "Process Updated successfully with data flow.",
      updateProcess,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function deleteProcess(req, res) {
  try {
    const { process_id, user_id } = req.body;
    // console.log("full request body: ", req.body);
    const filter = { process_id: process_id, user_id: user_id };
    const result = await Process.deleteOne(filter);
    if (result.deletedCount === 1) {
      // console.log('Successfully deleted one document.');
      // call method to delete all form related with it porcess start here
      // console.log("our process id : ", process_id)
      const form_result = await FormBuilderController.deleteAllFormBuilders(
        process_id
      );
      // console.log("delete form id data ", form_result)
      // end here
      res
        .status(201)
        .json({ message: "Specefied Process is deleted.", updateProcess });
    } else {
      // console.log("No documents matched the query. Deleted 0 documents.");
      res.status(201).json({
        message: "No process matched . Deleted 0 process.",
        updateProcess,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function confirmProcess(req, res) {
  try {
    const odooshInstance  = { yes: false };
    const { process_id, is_process_desing_completed, odoo_checking_data } =
      req.body;
    // console.log(
    //   "full request body: confirm checking and deployed ",
    //   req.body.process_id
    // );
    if (process_id === "") {
      return res.status(400).json({ message: "process_id is required." });
    }
    if (is_process_desing_completed === "") {
      return res
        .status(400)
        .json({ message: "is_process_desing_completed required." });
    }
    if (odoo_checking_data === "") {
      return res.status(400).json({ message: "odoo_checking_data required." });
    }
    const filter = { process_id: process_id };
    const update = {
      is_process_desing_completed: req.body.is_process_desing_completed,
      odoo_checking_data: req.body.odoo_checking_data,
    };
    const options = { new: true };
    const updateProcess = await Process.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateProcess) {
      return res.status(404).json({ message: "Process not found." });
    }

    // *********start calling save decision in node backend***************
    // const decisionNode = Service.getDecisionActivities(JSON.stringify(updateProcess.odoo_checking_data))
    const decisionNode = Service.getDecisionActivities(
      updateProcess.odoo_checking_data,
      updateProcess.process_id,
      updateProcess.process_name,
      updateProcess.process_detail
    );
    console.log(" 7878878877888 decison node: ", decisionNode);

    //start calling odoo controller
    // const base_url= 'http://localhost:8086'
    var test_end_point = "/parse/hello";

    var create_end_point = "/parse/create/test";

    // console.log(
    //   " debug startedzxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    //   updateProcess.user_id
    // );
    var userid = updateProcess.user_id;
    var odooBaseUrl = "";
    // fetch base  url from database:
    const isactive = true;
    // const userOdooBaseUrlModel = await UserConfig.findOne({ $and: [{ userid },{isactive}] });
    // console.log("Configuration aleardy setup for this user id and this type: ", userOdooBaseUrlModel)
    //  if(userOdooBaseUrlModel)
    // {
    //     odooBaseUrl = userOdooBaseUrlModel.parameter
    //     console.log("database base urL: ", odooBaseUrl)
    // }
    // // fetch base url from databse  end code

    // fetch url from process table
    // Fetch base URL from database fecth from process table
    // const userOdooBaseUrlModel = await Process.findOne({ userid: user_id ,process_id : process_id});
    const userOdooBaseUrlModel = await Process.findOne({
      $and: [{ process_id: process_id.trim() }],
    });

    if (!userOdooBaseUrlModel.database_url) {
      return res.status(404).json({
        message: "Current process is not bind to any database instance.",
      });
    }
    if (userOdooBaseUrlModel) {
      odooBaseUrl = userOdooBaseUrlModel.database_url;
      // console.log("Database base URL:", odooBaseUrl);
    }

    const existConfig = await UserConfig.findOne({
      $and: [
        { userid: updateProcess.user_id },
        { _id: updateProcess.database_obj.trim() },
        { isactive: true },
      ],
    });
    console.log("Existing configuration: ", existConfig);
    if (!existConfig) {
      return res.status(201).json({
        message: {
          message: "Configuration is not active",
          code: 198,
        },
      });
    }
    console.log(" *** checking params", existConfig.parameter);

    // console.log("before checking odoo base url is : ", apiUrl);
    // console.log("we are in odoo cheking step: ", updateProcess.process_image)
    if (updateProcess) {
      // console.log("we are in if block : and data type of request: ", typeof updateProcess.odoo_checking_data  )
      updateProcess.odoo_checking_data.process_image =
        updateProcess.process_image;
      // code for update middleware url
      let midUrl = updateProcess.midurl;
      if (!midUrl || updateProcess.midurl) {
        midUrl = decisionUrl;
      }
      updateProcess.odoo_checking_data.midurl = midUrl;
      // code for update middleware url


    // adding parameter for the repo detail
     
      updateProcess.odoo_checking_data.owner= existConfig?.owner || '',  
      updateProcess.odoo_checking_data.repo= existConfig?.repo || '',    
      updateProcess.odoo_checking_data.branch= existConfig?.branch || '',
      updateProcess.odoo_checking_data.token= existConfig?.accessToken || '',
      
      console.log(" *** process enviornment type ", updateProcess.environment_type)
      if(updateProcess.environment_type == 'odoo.sh')
      {
        console.log(" we are in odoo.sh depyloymnet and calling sync folder ");
        create_end_point = "/parse/create/odoosh/test";
        // check token is not expire
        const { expired, username} =  await Service.isGitHubTokenExpired(existConfig.accessToken)
        console.log("#############deploy token is expirte or not: ", expired)
        if(expired)
        {
          return res.status(404).json({
            message: "Odoosh token is expired. Please re -autherize again and deploy the same process.",
          });
        }
        // check token is not expire
        // make mark as this process is odoo.sh instance
        odooshInstance.yes = true;
        // call api that create table and table onchage its computed field
        
        // call api end 


      }

      // MDM data update
      const mdmModels = await CustomModel.find({database_url: odooBaseUrl });
      const extactMdm = mdmModels.map(item => ({
      model: item.model,
      model_id: item.id,
      model_name: item.name
      }));
      console.log(" ***** my mdm data : ", extactMdm)
      updateProcess.odoo_checking_data.mdm = extactMdm;
      // MDM data update

      const apiUrl = `${odooBaseUrl}${create_end_point}`;
      console.log("**** final normal odoosh. url ", apiUrl);

      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateProcess.odoo_checking_data),
        })
        .then(async (response) => {  
          console.log("Response data: ", response);

          if (!response.ok) {
            res.status(400).json({ message: "Internal server error due to BAD_REQUEST" });
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return response.json();
        })
        .then(async (data) => {  

          // if process is not attach with odoo.sh mean existing or new hutch then retrun immediately
          if (!odooshInstance.yes) {
            return res.status(201).json({ message: JSON.parse(data.result) });
          }

          // otherwise contine as of now bypass the odoo install as well.
          if (odooshInstance.yes) {
            return res.status(201).json({ message: JSON.parse(data.result) });
          }

          const onchangeEndPoint = "/parse/create/odoosh/field/onchange";
          const odooshOnchangeUrl = `${odooBaseUrl}${onchangeEndPoint}`;

          try {
            const response = await fetch(odooshOnchangeUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updateProcess.odoo_checking_data),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Success:", result);
            res.status(201).json({ message: JSON.parse(result.result) });

          } catch (error) {
            console.log("complete error message : ", error)
            console.log("Error:", error.message);
            res.status(400).json({ message: "Error in onchange API" });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          res.status(400).json({ message: "Internal server error." });
        });

    }
    // res.status(201).json({ message: 'Process Updated successfully with Json Data', updateProcess });
  } catch (error) {
    // res.status(500).json({ message: "Internal server error" + error });
      res.status(500).json({
      message: {
        message: "Try again or Contact to administrator : "+error,
        code: 500,
      },
    });
  }
}

async function releaseProcessDeployment(req, res) {
  try {
    const { process_id } = req.body;
    console.log(
      "full request body for process deployment release record ",
      req.body
    );
    const filter = { process_id: process_id };
    const procesObj = await Process.findOne(filter);
    if (procesObj) {
      console.log("Successfully deleted one document.");
      const result = await Temp.deleteMany({
        $and: [
          { process_id: procesObj.process_id },
          { user_id: procesObj.user_id },
          { database_url: procesObj.database_url },
        ],
      });
      res
        .status(201)
        .json({ message: "Specefied process is release is deleted.", result });
    } else {
      res
        .status(201)
        .json({ message: "No process matched to release", updateProcess });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// method to call create module
async function createModule(req, res) {
  console.log(" we are in create mdoule: ")
  try {
    const { process_id, user_id, process_name, secret_key } = req.body;
    let isRelatedToOdooInstance = false
    // console.log("Full request body for module creation:", req.body);

    // Validate input fields
    if (!process_id) {
      return res.status(400).json({ message: "Process Id is required." });
    }
    if (!user_id) {
      return res.status(400).json({ message: "User id is required." });
    }
    if (!process_name) {
      return res.status(400).json({ message: "Process Name is required." });
    }
    if (!secret_key) {
      return res.status(400).json({ message: "Secret key is required." });
    }

    // Initialize variables
    let create_end_point = "/parse/create/module";
    let odooBaseUrl = "";

    // Fetch base URL from database fecth from cofniguration table
    // const userOdooBaseUrlModel = await UserConfig.findOne({ userid: user_id ,isactive : true});
    // if (userOdooBaseUrlModel) {
    //     odooBaseUrl = userOdooBaseUrlModel.parameter;
    //     console.log("Database base URL:", odooBaseUrl);
    // }

    // Fetch base URL from database fecth from process table
    // const userOdooBaseUrlModel = await Process.findOne({ userid: user_id ,process_id: process_id});
    // console.log("user id: ", user_id);
    // console.log("process idk: ", process_id);
    // const userOdooBaseUrlModel = await Process.findOne({
    //   $and: [{ process_id: process_id.trim() }],
    // });
    const userOdooBaseUrlModel = await Process.findOne({ process_id: process_id.trim() }).lean();
    console.log("**********Yes process has url :", userOdooBaseUrlModel);

    if (!userOdooBaseUrlModel.database_url) {
      return res.status(404).json({
        message: "Current process is not bind to any database instance.",
      });
    }

    if (userOdooBaseUrlModel) {
      odooBaseUrl = userOdooBaseUrlModel.database_url;
      // console.log("Database base URL:", odooBaseUrl);
    }


    // validate request for odoo.sh ot not
    console.log("####troubleshoot enviornment type: ", userOdooBaseUrlModel.environment_type)
    console.log(" ##before proceed check end point for normal process and odoosh process: ")
    let checkConfig;
    if(userOdooBaseUrlModel.environment_type === 'odoo.sh')
    {
      create_end_point = '/parse/create/module/odoosh';
      isRelatedToOdooInstance = true;
      checkConfig = await UserConfig.findOne({
      $and: [
        { userid: user_id },
        { _id: userOdooBaseUrlModel.database_obj.trim() },
        { isactive: true },
      ],
      });
      
      if (!checkConfig.accessToken) {
        return res.status(404).json({
          message: "Odoosh Configuration need autherization. Please Autherize to complete this action.",
        });
      }

      // check token is not expire
      const { expired, username} =  await Service.isGitHubTokenExpired(checkConfig.accessToken)
      console.log("#############cheking token is expirte or not: ", expired,"access tocken :", checkConfig.accessToken)

      if(expired)
      {
        return res.status(404).json({
          message: "Odoosh token is expired. Please re -autherize again and checking the same process.",
        });
      }

      // check token is not expire

      

    }

    // Construct API URL
    const apiUrl = `${odooBaseUrl}${create_end_point}`;
    console.log("decided url API URL:", apiUrl);

    // Make API request

    const updatedBody = {
    ...req.body,        // Spread existing body data
    nodeUrl: decisionUrl,   // Add new key-value pairs
    timestamp: Date.now(),
    owner: checkConfig?.owner || '',  // Use optional chaining to safely access owner
    repo: checkConfig?.repo || '',    // Same for repo, branch, and token
    branch: checkConfig?.branch || '',
    token: checkConfig?.accessToken || '',
    };

    console.log("###final url befor hiting the api when create module : ", apiUrl)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedBody),
    });

    // Handle API response
    console.log("####create module log ", response)
    if (!response.ok) {
      console.log(" we chlkd log : in error line ", response)
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // console.log("Module response data:", data);
    // console.log(" moduel create data.result", data.result);
    const { message, code } = JSON.parse(data.result);
    // console.log("Module response data data.result.codedfdf:", message);
    // console.log("Module response data data.result.codezzzzzzzzzz:", code);

    if (code === "200") {
      // console.log("we in blcok ssntosh ");
      // Update process status
      const filter = { process_id: process_id, user_id: user_id };
      const update = { is_module_created: "true" };
      const options = { new: true };
      const updateProcess = await Process.findOneAndUpdate(
        filter,
        update,
        options
      );
      // console.log("update or not status;:", updateProcess);

      if (!updateProcess) {
        return res.status(404).json({
          message: "Module created but process not found to update status.",
        });
      }


      // check where thic checking type not related to odoo.sh instance
      if(isRelatedToOdooInstance)
      {

      try {

        console.log('Waiting for 30 seconds...');
        await sleep(30000);  // Wait for 15 seconds
        console.log('Hitting API after delay...');
        const point = '/install'
        const url = `${odooBaseUrl}${point}`;
        console.log(`Hitting API INSTALLATION PROCESS: ${url}`);
        // const response = await axios.get(url, { params: { name:userOdooBaseUrlModel.process_name } });

        await updateAppListOdoosh(odooBaseUrl, userOdooBaseUrlModel.process_name);
        await sleep(15000);
        await hitApiUntilSuccess(odooBaseUrl, userOdooBaseUrlModel.process_name);
    
        console.log(" extennal api hite: ", response.data)
        // res.json({ message: 'API called after 5 seconds', message: response.data });
      } catch (error) {
          // res.status(500).json({ error: 'Something went wrong', message: error.message });
        console.log(" *** in exeption :", error)
      }

      }
      // check where thic checking type

      return res.status(201).json({ message: message });
    } else {
      
      return res.status(404).json({ message: message });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" + error });
  }
}

async function importModule(req, res) {
  let process_import_status = false;
  try {
    const { user_id, api_key, data } = req.body;

    if (!user_id)
      return res.status(400).json({ message: "User Id is required." });
    if (!api_key || api_key !== apiKey) {
      return res.status(400).json({ message: "Unauthorized Access." });
    }

    const existingUser = await User.findOne({ userid: user_id });
    if (!existingUser)
      return res.status(400).json({ message: "User not found." });

    let process = data.process;
    let dynamic_process_id = Service.generate_process_key(process);
    process.process_id = dynamic_process_id;

    let nodesData = JSON.parse(process.process_data_flow.nodesData); // Parse nodesData
    let formArray = [];
    let form_id_with_name = {};
    let emailTemplates = new Map(); // Store templates by template_id
    let nodesGroupedByTemplate = new Map(); // Store nodes grouped by template_id
    // fetching existing config
    const existConfig = await UserConfig.findOne({
      $and: [
        { _id: process.database_obj },
        { parameter: process.database_url },
      ],
    });
    const odoo_version = existConfig.odoo_version;
    console.log("Import::: existConfig: ", existConfig);
    console.log("Import::: odoo_version: ", odoo_version);

    // Step 1: Iterate over nodesData to handle forms and collect email templates
    for (const node of nodesData) {
      // Handle form nodes (existing logic)
      if (node.data.isFormSelected && node.data.form) {
        const form = node.data.form;
        if (!form_id_with_name[form.form_builder_name]) {
          let dynamic_form_id = Service.generate_form_key(form);
          form.form_builder_id = dynamic_form_id;
          form.process_id = dynamic_process_id;
          form.user_id = process.user_id;

          formArray.push(form);
          form_id_with_name[form.form_builder_name] = dynamic_form_id;

          let newFormBuilder = new FormBuilder({
            form_builder_id: dynamic_form_id,
            form_builder_name: form.form_builder_name,
            form_builder_detail: form.form_builder_detail,
            formbuilder_data: form.formbuilder_data,
            user_id: process.user_id,
            process_id: dynamic_process_id,
          });
          await newFormBuilder.save();
        }
        node.data.form.form_builder_id =
          form_id_with_name[form.form_builder_name];
      }

      // Handle email nodes
      if (node.type === "email" && node.data.template) {
        const { template_id, ...templateData } = node.data.template;

        if (!emailTemplates.has(template_id)) {
          emailTemplates.set(template_id, templateData); // Store template data
          nodesGroupedByTemplate.set(template_id, []); // Initialize node list for this template_id
        }

        // Group nodes by their template_id for later processing
        nodesGroupedByTemplate.get(template_id).push(node);
      }
    }

    // Step 2: Save templates in MongoDB and update nodes with new template IDs
    for (const [template_id, templateData] of emailTemplates) {
      let newTemplate = new emailTemplate({
        ...templateData,
        // process_id: dynamic_process_id,
        user_id: process.user_id,
      });
      const savedTemplate = await newTemplate.save(); // Save template and get new _id

      // Update all nodes that used this template_id with the new `_id`
      nodesGroupedByTemplate.get(template_id).forEach((node) => {
        node.data.template.template_id = savedTemplate._id;
      });
    }

    // Step 3: Update process_data_flow with modified nodesData
    process.process_data_form = JSON.stringify(formArray); // Update form data
    process.process_data_flow = {
      ...process.process_data_flow, // Retain existing edgesData
      nodesData: JSON.stringify(nodesData), // Update nodesData with latest changes
    };

    // Step 4: Save the process with the updated data
    let newProcess = new Process({
      process_id: dynamic_process_id,
      process_group: process.process_group,
      process_group_category: process.process_group_category,
      process_name: process.process_name,
      process_detail: process.process_detail,
      user_id: process.user_id,
      process_data_flow: process.process_data_flow,
      process_data_form: process.process_data_form,
      process_image: process.process_image || null,
      database: process.database,
      database_obj: process.database_obj,
      database_url: process.database_url,
      odoo_version,
      odoo_checking_data: null,
      is_module_created: process.is_module_created,
      is_process_desing_completed: process.is_process_desing_completed,
      odoo_checking_status: process.odoo_checking_status,
      environment_type :existConfig.databasetype,
    });

    await newProcess.save(); // Save the new process
    process_import_status = true;

    return res.status(process_import_status ? 201 : 400).json({
      message: process_import_status
        ? "Process imported successfully."
        : "Process import unsuccessful.",
    });
  } catch (error) {
    console.error("Error during process import: ", error);
    return res.status(500).json({ message: "Internal server error: " + error });
  }
}

// =================================================================
async function restartOdooServer(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { database_url, key } = decryptedPayload;
    // const { process_id, key } = req.body;
    // Validation checks

    if (!database_url) {
      return res.status(400).json({ message: "database_url is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access. User contact to administrator.",
      });
    }

    // const userOdooBaseUrlModel = await Process.findOne({
    //   $and: [{ process_id }],
    // });
    // console.log("Process is model is  ", userOdooBaseUrlModel);
    // console.log(
    //   "Process is model base url is   ",
    //   userOdooBaseUrlModel.database_url
    // );

    // Hit Odoo API here to call API
    console.log(" *** database url for server restart : ", database_url);
    if (true) {
      const odooApiUrl = database_url + "/restart_oflow"; // Replace with your Odoo API URL
      // console.log(" *********restart odoo server url : ", odooApiUrl);
      const odooCredentials = {
        username: "o2b_user",
      };
      const headers = {
        "Content-Type": "application/json",
        "X-Security-Key": key,
      };

      const response = await fetch(odooApiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(odooCredentials),
      });

      // console.log(" *** full reponse of restart odoo server  ", response);
      if (!response.ok) {
        const errorData = await response.json();
        return res
          .status(500)
          .json({ message: "Failed to restart Odoo server", error: errorData });
      }
      const data = await response.json();
      // console.log("Odoo response:", data);

      // End here
      return res
        .status(200)
        .json({ message: "Server restart command initiated." });
    }
  } catch (error) {
    console.log(" ****error ", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// create field process method
async function confirmProcessUpdate(req, res) {
  // try {
  const { process_id, is_process_desing_completed, odoo_checking_data } =
    req.body;
  // console.log(
  //   "full request body: confirm checking and deployed ",
  //   req.body.process_id
  // );
  if (process_id === "") {
    return res.status(400).json({ message: "process_id is required." });
  }
  if (is_process_desing_completed === "") {
    return res
      .status(400)
      .json({ message: "is_process_desing_completed required." });
  }
  if (odoo_checking_data === "") {
    return res.status(400).json({ message: "odoo_checking_data required." });
  }
  const filter = { process_id: process_id };
  const update = {
    is_process_desing_completed: req.body.is_process_desing_completed,
    odoo_checking_data: req.body.odoo_checking_data,
  };
  const options = { new: true };
  const updateProcess = await Process.findOneAndUpdate(filter, update, options);
  if (!updateProcess) {
    return res.status(404).json({ message: "Process not found to upadte." });
  }

  // *********start calling save decision in node backend***************
  const decisionNode = Service.getDecisionActivities(
    updateProcess.odoo_checking_data,
    updateProcess.process_id,
    updateProcess.process_name,
    updateProcess.process_detail
  );
  console.log(" we process fied api: ", decisionNode);

  //start calling odoo controller
  // const base_url= 'http://localhost:8086'
  const test_end_point = "/parse/hello";
  var create_end_point = "/parse/create/field";
  var userid = updateProcess.user_id;
  var odooBaseUrl = "";
  // fetch base  url from database:
  const isactive = true;

  const userOdooBaseUrlModel = await Process.findOne({
    $and: [{ process_id: process_id.trim() }],
  });


  if (!userOdooBaseUrlModel.database_url) {
    return res.status(201).json({
      message: {
        message: "Current process is not bind to any database instance.",
        code: 198,
      },
    });
  }
  if (userOdooBaseUrlModel) {
    odooBaseUrl = userOdooBaseUrlModel.database_url;
    // console.log("Database base URL:", odooBaseUrl);
  }
  // console.log("oject to find deployment lock status ", anotherDeploymentStatus);
  let processFurther = false;
  const exist = await Temp.findOne({
    $and: [
      { database_url: updateProcess.database_url },
      { type: "deployment_lock" },
    ],
  });
  console.log("Record found for lock", exist);
  if (exist) {
    // Check if the existing lock is for a different process
    if (exist.process_id != updateProcess.process_id) {
      console.log("Someone else is using this process.");
      return res.status(201).json({
        message: {
          message:
            "The deployment is in progress by another user; kindly wait for it to finish.",
          code: 198,
        },
      });
    }
  } else {
    
      const newLock = new Temp({
      process_id: updateProcess.process_id,
      process_name: updateProcess.process_name,
      user_id: updateProcess.user_id,
      database: updateProcess.database,
      database_obj: updateProcess.database_obj,
      database_url: updateProcess.database_url,
      status: true,
      type: "deployment_lock",
    });
    await newLock.save();
    console.log("New deployment lock created.");
  }
  // check deployent lock status

  // ***********check license key if blank or invalid then return proper message****
  const existConfig = await UserConfig.findOne({
    $and: [
      { userid: updateProcess.user_id },
      { _id: updateProcess.database_obj.trim() },
      { isactive: true },
    ],
  });
  console.log("Existing configuration: ", existConfig);
  if (!existConfig) {
    return res.status(201).json({
      message: {
        message: "Configuration is not active",
        code: 198,
      },
    });
  }
  console.log(" *** checking params", existConfig.parameter);
  console.log(" *** checking license", existConfig.license_key);
  const licenseKey = existConfig.license_key || "NO_LICENSE_OBJ";
  console.log(" ** licenseKey", licenseKey);
  if (!existConfig.license_key && !existConfig.hasOwnProperty("license_key")) {
    console.log(" ** license_key is missing or invalid");
    return res.status(201).json({
      message: {
          message:
            "Process does not have active License. Contact to administrator.",
          code: 198,
        },
      });
    } else {
      const existingSubscription = await Subscription.findOne({license_key: existConfig.license_key, });
      console.log(" **** license_key obje", existingSubscription);
      if (!existingSubscription) {
        return res.status(201).json({
          message: {
            message:
              "Invalid License key is associated with current process. Contact to administrator. ",
            code: 198,
          },
        });
      }

      if (existingSubscription) {
        const { current_status } = existingSubscription;
        console.log(" my license key is not expiring: ", current_status);
        if (!current_status) {
          return res.status(201).json({
            message: {
              message: "User License Key is expired.",
              code: 198,
            },
          });
        }
      }
    }
  
     // call reconcile user draw field with database existing field with type
    if(true)
    {
      try {
        const reconcileEndpoint = '/parse/create/odoosh/datatype';
        const recFinalUrl = `${odooBaseUrl}${reconcileEndpoint}`;
        console.log("### reconcile api hited ", recFinalUrl);

        const response = await fetch(recFinalUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateProcess.odoo_checking_data),
        });

        console.log("Reconcile field check API hit", response);

        if (!response.ok) {
          throw new Error(`HTTP error in reconcile field! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("**Reconcile response:", data);

        const reconcileResult = JSON.parse(data.result);
        if(reconcileResult.message === 'Perfect' && reconcileResult.code == '200')
        {
          console.log("##reconcile log success ", reconcileResult)
        }
        else
        {
          console.log("***reconcile faild feild is exist", reconcileResult)
          return res.status(201).json({ message: {message: reconcileResult.message, code: 198,}});

        }
        // do something with data
      } catch (error) {
        console.error("Error in reconcile field API:", error);
        // show error to user or handle it
      }

    }
    // call reconcile user draw field with database existing field with type

    await sleep(1000)

  // const apiUrl = `${odooBaseUrl}${create_end_point}`;
  // ***********check license key if blank or invalid then return proper message****
    console.log(" reconcile run successful.procceeding to create checking and model start here")
  if (updateProcess) {
    updateProcess.odoo_checking_data.process_image =
    updateProcess.process_image;
    updateProcess.odoo_checking_data.client_rule_engine =
    existConfig.client_rule_engine;
    // code for update middleware url
    let midUrl = updateProcess.midurl;
    if (!midUrl || updateProcess.midurl) {
      midUrl = decisionUrl;
    }
    // updateProcess.odoo_checking_data
    updateProcess.odoo_checking_data.midurl = midUrl;

    // adding parameter for the repo detail
    updateProcess.odoo_checking_data.owner = existConfig?.owner || '',  
    updateProcess.odoo_checking_data.repo = existConfig?.repo || '',    
    updateProcess.odoo_checking_data.branch = existConfig?.branch || '',
    updateProcess.odoo_checking_data.token = existConfig?.accessToken || '',
    // adding parameter for the repo detail

      console.log(" ***** before proceeding check is process related to odoosh enviornment type ", updateProcess.environment_type)
    // code for redirect if process is related to odoosh
      const odooshInstance  = { yes: false };
      if (updateProcess.environment_type === 'odoo.sh') {
        odooshInstance.yes = true

      // check token is not expire
        const { expired, username} =  await Service.isGitHubTokenExpired(existConfig.accessToken)
        console.log("#############deploy token is expirte or not: ", expired, "user tocken : ", existConfig.accessToken)

        if(expired)
        {
          return res.status(404).json({
            message: "Odoosh token is expired. Please re -autherize again and deploy the same process.",
          });
        }
      // check token is not expire

        console.log("We are in odoo.sh deployment and calling sync folder");
        var end_point = "/parse/create/field/odoosh/before/deploy";
        var targetUrl = `${odooBaseUrl}${end_point}`;
        console.log("###Before deployment URL of API is", targetUrl);
        fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateProcess.odoo_checking_data),
        }).catch((error) => {
        console.log("Error in deployed before first API:", error);
        });
        console.log("API called, not waiting for response. for sync folder");
        await sleep(2000)

       // complte onchange or create field or compute field
        console.log("we are in writing new file");
        var odoosh_create_end_point = "/parse/create/odoosh/field";
        var finalOddoshUrl = `${odooBaseUrl}${odoosh_create_end_point}`;
        try {
        const response = await fetch(finalOddoshUrl, {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          },
          body: JSON.stringify(updateProcess.odoo_checking_data),
          });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
          console.log(" odoo first api hited and run completlely odoosh field", data);
        } catch (error) {
          console.log("Error in create field odoo first api: odooshfield", error);
        }
        console.log(" finalOddoshUrl completed successfull. complete odoosh/field")

       // call api odoosh field that will create new table or write someing 
        await sleep(2000)

        // another api hited for onchage or create new table or new table changes
        console.log("we are in writing new file for onchange");
        var onchangeUrl = "/parse/create/odoosh/field/onchange";
        var finalOnchagneUrl = `${odooBaseUrl}${onchangeUrl}`;
        try {
        const response = await fetch(finalOnchagneUrl, {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          },
          body: JSON.stringify(updateProcess.odoo_checking_data),
          });

        if (!response.ok) {
          throw new Error("Network response was not ok onchange");
        }

        const data = await response.json();
          console.log(" on change reponse Response data onchane :", data);
        } catch (error) {
          console.log("Error in create field or onchange table onchange:", error);
        }
        // another api hited for onchage or create new table or new table changes



        await sleep(2000)

       // call api odoosh field that will create new table or write someing 
        console.log("we are in writing new file for final");
        var odooshFinalCreateField = "/parse/create/odoosh/table/final";
        var odooshFinalCreateFieldUrl = `${odooBaseUrl}${odooshFinalCreateField}`;
        try {
        const response = await fetch(odooshFinalCreateFieldUrl, {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          },
          body: JSON.stringify(updateProcess.odoo_checking_data),
          });

        if (!response.ok) {
          throw new Error("Network response was not ok in final");
        }
        const data = await response.json();
          console.log(" reponse in final api", data);
          console.log("waiting hardcode time for 1 minute 30 seconde")
          await sleep(90000)
          return res.status(201).json({ message: JSON.parse(data.result) });
        } catch (error) {
          console.log("Error in create field odoo first api: final", error);
        }
        console.log("all things is run upp..")
        }

    // code for redirect if process is related to odoosh


     // await sleep(2000);

    if( !odooshInstance.yes)
    {
    const apiUrl = `${odooBaseUrl}${create_end_point}`;
    console.log(" same final url of api is ", apiUrl)
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateProcess.odoo_checking_data),
      })
      .then((response) => {
        console.log("deployed first api  respoonse data: ", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
          res
            .status(400)
            .json({ message: "Internal server error due to BAD_RREQUEST" });
        }
        return response.json();
      })
      .then((data) => {
        // Handle the response data
        console.log("**********data deploy first api  : ", data, data.result);

        res.status(201).json({ message: JSON.parse(data.result) });
      })
      .catch((error) => {
        // Handle the error
        console.log(" error in deployed first api ", error);
        res.status(500).json({  message: {message: "Try again or Contact to administrator : "+error, code: 500, }});
      });
    }
  }
}

// check server status is running or not
async function restartOdooStatus(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { database_url, key } = decryptedPayload;

    // Validation checks
    if (!database_url) {
      return res.status(400).json({ message: "database_url is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access. Contact administrator.",
      });
    }

    // Find the user's Odoo base URL from the database
    // const userOdooBaseUrlModel = await Process.findOne({
    //   $and: [{ process_id }],
    // });

    // Ensure the URL exists
    // if (!userOdooBaseUrlModel || !userOdooBaseUrlModel.database_url) {
    //   return res.status(500).json({
    //     message: "Odoo database URL not found for the given process_id.",
    //   });
    // }

    // Odoo API URL
    console.log(" server status base url Current instance ", database_url);
    const odooApiUrl = database_url + "/server/status";
    const odooCredentials = {
      username: "o2b_user",
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Security-Key": key,
    };

    // Function to check the server status continuously
    async function checkServerStatus() {
      while (true) {
        try {
          // Send POST request to the Odoo server status endpoint
          const response = await fetch(odooApiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(odooCredentials),
          });

          // If the response is successful (status 200), break out of the loop
          if (response.ok) {
            const data = await response.json();
            console.log("Odoo server is up and running:", data);
            return res.status(200).json({ message: "Server is running." });
          } else {
            const errorData = await response.json();
            console.log("Odoo server responded but with error:", errorData);
            // Retry if the response is not ok
          }
        } catch (error) {
          // Catch any error and retry
          console.log("Error connecting to Odoo server, retrying...");
        }

        // Wait for 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Start checking the server status
    await checkServerStatus();
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// ***********schedular on off status controller *************
async function updateProcessSchedularStatus(req, res) {
  try {
    const { process_id, user_id } = req.body;
    console.log("full request body for shedular on/off", req.body);
    const processes = await Process.findOne({
      $and: [{ process_id }, { user_id }],
    });
    if (!processes || processes.length === 0) {
      return res
        .status(404)
        .json({ message: "No process detail found for this process id." });
    }
    let url = processes.database_url;
    if (!url) {
      return res.status(401).json({
        message: "No Hutch bind to this process.Please check.",
        code: 401,
      });
    }
    // console.log("publish url : ", url);
    let end_point;
    let apiUrl;
    let data;
    let response;
    const key = "o2b_technologies";
    if (req.body.status) {
      // console.log("we active stausl ", req.body.status);
      end_point = "/process/schedular/status/change/active";
      apiUrl = `${url}${end_point}?key=${encodeURIComponent(
        key
      )}&process_id=${encodeURIComponent(
        processes.process_id
      )}&status=${encodeURIComponent(req.body.status)}`;
      // console.log("Connection URL: ", apiUrl);
      // response = await fetch(apiUrl);
      response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      data = await response.json();
      // console.log("Connection successful:", data);
      if (data.code === "401") {
        return res.status(401).json({ message: data.message, code: 401 });
      }
    } else {
      // console.log("inactive statrus; ", req.body.status);
      end_point = "/process/schedular/status/change/inactive";
      apiUrl = `${url}${end_point}?key=${encodeURIComponent(
        key
      )}&process_id=${encodeURIComponent(
        processes.process_id
      )}&status=${encodeURIComponent(req.body.status)}`;
      // console.log("Connection URL: ", apiUrl);
      response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      data = await response.json();
      // console.log("Connection successful:", data);
      if (data.code === "401") {
        return res.status(401).json({ message: data.message, code: 401 });
      }
    }

    // write code for publish an unpublished in odoo backend
    const filter = { process_id: process_id, user_id: user_id };
    const update = { schedular_status: req.body.status };
    const options = { new: true };
    const updateProcess = await Process.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updateProcess) {
      return res.status(404).json({ message: "Process not found." });
    }
    res.status(201).json({ message: data.message, updateProcess });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}
// ***********schedular on off status controller *************

// **** module upgrade api***************
// =================================================================
async function moduleUpgrade(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { database_url, key, process_name } = decryptedPayload;
    // const { database_url , key ,process_name} = req.body;
    // Validation checks

    // console.log(" ****** full reuqoers;:",req.body)
    if (!database_url) {
      return res.status(400).json({ message: "Database_url is required." });
    }

    if (!process_name) {
      return res.status(400).json({ message: "Process_name is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access user.Please contact to administrator.",
      });
    }

    // Hit Odoo API here to call API
    console.log(" *** database url for upgrading : ", database_url);
    if (true) {
      const odooApiUrl = database_url + "/upgrade/module";
      const odooCredentials = {
        username: "o2b_user",
        process_name: process_name,
      };
      const headers = {
        "Content-Type": "application/json",
        "X-Security-Key": key,
      };

      const response = await fetch(odooApiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(odooCredentials),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return res
          .status(500)
          .json({ message: "Failed to restart Odoo server", error: errorData });
      }
      const data = await response.json();
      console.log(" ***** response while upgrading :", data);
      return res.status(200).json({ message: " Upgraded successfully." });
    }
  } catch (error) {
    console.log(" ****catch error from module upgrade ", error);
    res.status(500).json({
      message: "Internal server error while upgrading: " + error.message,
    });
  }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Sleep function to pause execution
// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function hitApiUntilSuccess(odooBaseUrl, processName) {
  const point = '/install';
  const url = `${odooBaseUrl}${point}`;
  
  try {
    console.log('Waiting for 30 seconds...');
    await sleep(30000);  // Wait for 30 seconds
    
    console.log(`Hitting API: ${url}`);
    const response = await axios.get(url, { params: { name: processName,apptype: 'app' } });
    
    console.log("External API hit:", response.data);

    // Check response code
    if (response.data.code === '201') {
      console.log("Module installation successful!");
      return;
    } else {
      console.log("Module still installing... Retrying.");
      await hitApiUntilSuccess(odooBaseUrl, processName);  // Recursive call
    }

  } catch (error) {
    console.log(" *** in exception :", error.message);
  }
}


async function updateAppListOdoosh(odooBaseUrl, processName) {
  const point = '/odoosh/updatelist';
  const url = `${odooBaseUrl}${point}`;
  
  try {
    console.log('Waiting for 30 seconds...');
    await sleep(30000);  // Wait for 30 seconds
    
    console.log(`Hitting API: ${url}`);
    const response = await axios.get(url, { params: { name: processName,apptype: 'app' } });
    
    console.log("External API hit:", response.data);

    // Check response code
    if (response.data.code === '201') {
      console.log("Module app update  successful!");
      return;
    } else {
      console.log("app update  still ... Retrying.");
      await updateAppListOdoosh(odooBaseUrl, processName);  // Recursive call
    }

  } catch (error) {
    console.log(" *** in exception :", error.message);
  }
}

// **** module upgrade api***************

async function confirmProcessUpdatebefore(req, res) {
  // try {
  const { process_id, is_process_desing_completed, odoo_checking_data } =
    req.body;
  // console.log(
  //   "full request body: confirm checking and deployed ",
  //   req.body.process_id
  // );
  if (process_id === "") {
    return res.status(400).json({ message: "process_id is required." });
  }
  if (is_process_desing_completed === "") {
    return res
      .status(400)
      .json({ message: "is_process_desing_completed required." });
  }
  if (odoo_checking_data === "") {
    return res.status(400).json({ message: "odoo_checking_data required." });
  }
  const filter = { process_id: process_id };
  const update = {
    is_process_desing_completed: req.body.is_process_desing_completed,
    odoo_checking_data: req.body.odoo_checking_data,
  };
  const options = { new: true };
  const updateProcess = await Process.findOneAndUpdate(filter, update, options);
  if (!updateProcess) {
    return res.status(404).json({ message: "Process not found to upadte." });
  }

  // *********start calling save decision in node backend***************
  const decisionNode = Service.getDecisionActivities(
    updateProcess.odoo_checking_data,
    updateProcess.process_id,
    updateProcess.process_name,
    updateProcess.process_detail
  );
  console.log(" we process fied api: ", decisionNode);

  //start calling odoo controller
  // const base_url= 'http://localhost:8086'
  const test_end_point = "/parse/create/module/before/deploy";
  const create_end_point = "/parse/create/field";
  const create_end_point_before = "/parse/create/module/before/deploy";
  const create_end_point_after = "/parse/create/module/after/deploy";
  var userid = updateProcess.user_id;
  var odooBaseUrl = "";
  // fetch base  url from database:
  const isactive = true;

  const userOdooBaseUrlModel = await Process.findOne({
    $and: [{ process_id: process_id.trim() }],
  });

  if (!userOdooBaseUrlModel.database_url) {
    return res.status(201).json({
      message: {
        message: "Current process is not bind to any database instance.",
        code: 198,
      },
    });
  }
  if (userOdooBaseUrlModel) {
    odooBaseUrl = userOdooBaseUrlModel.database_url;
    // console.log("Database base URL:", odooBaseUrl);
  }
  // console.log("oject to find deployment lock status ", anotherDeploymentStatus);
  let processFurther = false;
  const exist = await Temp.findOne({
    $and: [
      { database_url: updateProcess.database_url },
      { type: "deployment_lock" },
    ],
  });
  console.log("Record found for lock", exist);
  if (exist) {
    // Check if the existing lock is for a different process
    if (exist.process_id != updateProcess.process_id) {
      console.log("Someone else is using this process.");
      return res.status(201).json({
        message: {
          message:
            "The deployment is in progress by another user; kindly wait for it to finish.",
          code: 198,
        },
      });
    }
  } else {
    const newLock = new Temp({
      process_id: updateProcess.process_id,
      process_name: updateProcess.process_name,
      user_id: updateProcess.user_id,
      database: updateProcess.database,
      database_obj: updateProcess.database_obj,
      database_url: updateProcess.database_url,
      status: true,
      type: "deployment_lock",
    });
    await newLock.save();
    console.log("New deployment lock created.");
  }
  // check deployent lock status

  // ***********check license key if blank or invalid then return proper message****
  const existConfig = await UserConfig.findOne({
    $and: [
      { userid: updateProcess.user_id },
      { _id: updateProcess.database_obj.trim() },
      { isactive: true },
    ],
  });
  console.log("Existing configuration: ", existConfig);
  if (!existConfig) {
    return res.status(201).json({
      message: {
        message: "Configuration is not active",
        code: 198,
      },
    });
  }
  console.log(" *** checking params", existConfig.parameter);
  console.log(" *** checking license", existConfig.license_key);
  const licenseKey = existConfig.license_key || "NO_LICENSE_OBJ";
  console.log(" ** licenseKey", licenseKey);
  if (!existConfig.license_key && !existConfig.hasOwnProperty("license_key")) {
    console.log(" ** license_key is missing or invalid");
    return res.status(201).json({
      message: {
        message:
          "Process does not have active License. Contact to administrator.",
        code: 198,
      },
    });
  } else {
    const existingSubscription = await Subscription.findOne({
      license_key: existConfig.license_key,
    });
    console.log(" **** license_key obje", existingSubscription);
    if (!existingSubscription) {
      return res.status(201).json({
        message: {
          message:
            "Invalid License key is associated with current process. Contact to administrator. ",
          code: 198,
        },
      });
    }

    if (existingSubscription) {
      const { current_status } = existingSubscription;
      console.log(" my license key is not expiring: ", current_status);
      if (!current_status) {
        return res.status(201).json({
          message: {
            message: "User License Key is expired.",
            code: 198,
          },
        });
      }
    }
  }

  // ***********check license key if blank or invalid then return proper message****

  // check which end point is executed for odoosh
  if(existConfig.token && existConfig.owner && existConfig.repo && existConfig.branch)
  {
    create_end_point = create_end_point_before
  }

  if(existConfig.type == 'last_oddosh')
  {

    create_end_point = create_end_point_after 
  }
  // check which end point is executed for odoosh

  // const apiUrl = `${baseUrl}${create_end_point}`;
  const apiUrl = `${odooBaseUrl}${create_end_point}`;
  if (updateProcess) {
    updateProcess.odoo_checking_data.process_image =
      updateProcess.process_image;
    updateProcess.odoo_checking_data.client_rule_engine =
      existConfig.client_rule_engine;
    // code for update middleware url
    let midUrl = updateProcess.midurl;
    if (!midUrl || updateProcess.midurl) {
      midUrl = decisionUrl;
    }
    updateProcess.odoo_checking_data.midurl = midUrl;
    // code for update middleware url

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateProcess.odoo_checking_data),
    })
      .then((response) => {
        console.log("rrrrrrrrrrr respoonse data: ", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
          res
            .status(400)
            .json({ message: "Internal server error due to BAD_RREQUEST" });
        }
        return response.json();
      })
      .then((data) => {
        // Handle the response data
        // console.log("**********data : ", data, data.result);

        res.status(201).json({ message: JSON.parse(data.result) });
      })
      .catch((error) => {
        // Handle the error
        // console.error(" rrrrrrrrrrrrError:", error);
      res.status(500).json({
      message: {
        message: "Try again or Contact to administrator : "+error,
        code: 500,
      },
    });
      });
  }

}



async function confirmProcessUpdatebeafter(req, res) {
  // try {
  const { process_id, is_process_desing_completed, odoo_checking_data } =
    req.body;
  // console.log(
  //   "full request body: confirm checking and deployed ",
  //   req.body.process_id
  // );
  if (process_id === "") {
    return res.status(400).json({ message: "process_id is required." });
  }
  if (is_process_desing_completed === "") {
    return res
      .status(400)
      .json({ message: "is_process_desing_completed required." });
  }
  if (odoo_checking_data === "") {
    return res.status(400).json({ message: "odoo_checking_data required." });
  }
  const filter = { process_id: process_id };
  const update = {
    is_process_desing_completed: req.body.is_process_desing_completed,
    odoo_checking_data: req.body.odoo_checking_data,
  };
  const options = { new: true };
  const updateProcess = await Process.findOneAndUpdate(filter, update, options);
  if (!updateProcess) {
    return res.status(404).json({ message: "Process not found to upadte." });
  }

  // *********start calling save decision in node backend***************
  const decisionNode = Service.getDecisionActivities(
    updateProcess.odoo_checking_data,
    updateProcess.process_id,
    updateProcess.process_name,
    updateProcess.process_detail
  );
  console.log(" we process fied api: ", decisionNode);

  //start calling odoo controller
  // const base_url= 'http://localhost:8086'
  const test_end_point = "/parse/create/module/before/deploy";
  const create_end_point = "/parse/create/field";
  const create_end_point_before = "/parse/create/module/before/deploy";
  const create_end_point_after = "/parse/create/module/after/deploy";
  var userid = updateProcess.user_id;
  var odooBaseUrl = "";
  // fetch base  url from database:
  const isactive = true;

  const userOdooBaseUrlModel = await Process.findOne({
    $and: [{ process_id: process_id.trim() }],
  });

  if (!userOdooBaseUrlModel.database_url) {
    return res.status(201).json({
      message: {
        message: "Current process is not bind to any database instance.",
        code: 198,
      },
    });
  }
  if (userOdooBaseUrlModel) {
    odooBaseUrl = userOdooBaseUrlModel.database_url;
    // console.log("Database base URL:", odooBaseUrl);
  }
  // console.log("oject to find deployment lock status ", anotherDeploymentStatus);
  let processFurther = false;
  const exist = await Temp.findOne({
    $and: [
      { database_url: updateProcess.database_url },
      { type: "deployment_lock" },
    ],
  });
  console.log("Record found for lock", exist);
  if (exist) {
    // Check if the existing lock is for a different process
    if (exist.process_id != updateProcess.process_id) {
      console.log("Someone else is using this process.");
      return res.status(201).json({
        message: {
          message:
            "The deployment is in progress by another user; kindly wait for it to finish.",
          code: 198,
        },
      });
    }
  } else {
    const newLock = new Temp({
      process_id: updateProcess.process_id,
      process_name: updateProcess.process_name,
      user_id: updateProcess.user_id,
      database: updateProcess.database,
      database_obj: updateProcess.database_obj,
      database_url: updateProcess.database_url,
      status: true,
      type: "deployment_lock",
    });
    await newLock.save();
    console.log("New deployment lock created.");
  }
  // check deployent lock status

  // ***********check license key if blank or invalid then return proper message****
  const existConfig = await UserConfig.findOne({
    $and: [
      { userid: updateProcess.user_id },
      { _id: updateProcess.database_obj.trim() },
      { isactive: true },
    ],
  });
  console.log("Existing configuration: ", existConfig);
  if (!existConfig) {
    return res.status(201).json({
      message: {
        message: "Configuration is not active",
        code: 198,
      },
    });
  }
  console.log(" *** checking params", existConfig.parameter);
  console.log(" *** checking license", existConfig.license_key);
  const licenseKey = existConfig.license_key || "NO_LICENSE_OBJ";
  console.log(" ** licenseKey", licenseKey);
  if (!existConfig.license_key && !existConfig.hasOwnProperty("license_key")) {
    console.log(" ** license_key is missing or invalid");
    return res.status(201).json({
      message: {
        message:
          "Process does not have active License. Contact to administrator.",
        code: 198,
      },
    });
  } else {
    const existingSubscription = await Subscription.findOne({
      license_key: existConfig.license_key,
    });
    console.log(" **** license_key obje", existingSubscription);
    if (!existingSubscription) {
      return res.status(201).json({
        message: {
          message:
            "Invalid License key is associated with current process. Contact to administrator. ",
          code: 198,
        },
      });
    }

    if (existingSubscription) {
      const { current_status } = existingSubscription;
      console.log(" my license key is not expiring: ", current_status);
      if (!current_status) {
        return res.status(201).json({
          message: {
            message: "User License Key is expired.",
            code: 198,
          },
        });
      }
    }
  }

  // ***********check license key if blank or invalid then return proper message****

  // check which end point is executed for odoosh
  if(existConfig.token && existConfig.owner && existConfig.repo && existConfig.branch)
  {
    create_end_point = create_end_point_before
  }

  if(existConfig.type == 'last_oddosh')
  {

    create_end_point = create_end_point_after 
  }
  // check which end point is executed for odoosh

  // const apiUrl = `${baseUrl}${create_end_point}`;
  const apiUrl = `${odooBaseUrl}${create_end_point}`;
  if (updateProcess) {
    updateProcess.odoo_checking_data.process_image =
      updateProcess.process_image;
    updateProcess.odoo_checking_data.client_rule_engine =
      existConfig.client_rule_engine;
    // code for update middleware url
    let midUrl = updateProcess.midurl;
    if (!midUrl || updateProcess.midurl) {
      midUrl = decisionUrl;
    }
    updateProcess.odoo_checking_data.midurl = midUrl;
    // code for update middleware url

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateProcess.odoo_checking_data),
    })
      .then((response) => {
        console.log("rrrrrrrrrrr respoonse data: ", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
          res
            .status(400)
            .json({ message: "Internal server error due to BAD_RREQUEST" });
        }
        return response.json();
      })
      .then((data) => {
        // Handle the response data
        // console.log("**********data : ", data, data.result);

        res.status(201).json({ message: JSON.parse(data.result) });
      })
      .catch((error) => {
        // Handle the error
        // console.error(" rrrrrrrrrrrrError:", error);
      res.status(500).json({
      message: {
        message: "Try again or Contact to administrator : "+error,
        code: 500,
      },
    });
      });
  }

}

// =================================================================
module.exports = {
  getProcessesByUserId,
  createProcess,
  updateProcess,
  deleteProcess,
  confirmProcess,
  updateProcessStatus,
  updateProcessModuleStatus,
  getProcessesByProcessIdUserId,
  createModule,
  importModule,
  restartOdooServer,
  confirmProcessUpdate,
  restartOdooStatus,
  updateProcessSchedularStatus,
  releaseProcessDeployment,
  moduleUpgrade,
  
};