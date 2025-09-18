const Subscription = require("../models/subscription");
// const UserConfig = require("../models/userConfig").default;
const UserConfig = require("../models/userConfig");
const Service = require("../services/services");
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;
// new get base url:
const decisionUrl = process.env.DECISION_URL;
const { LocalStorage } = require('node-localstorage')

const localStorage = new LocalStorage('./oflow');



// old working code ==================================================
// async function createUserConfig(req, res) {
//     try {
//         console.log("Full request body in create config for existing database: ", req.body);
//         const { userid, configname, configtype, parameter, securitykey, database, key, databasetype } = req.body;

//         // Validation checks
//         if (!userid) {
//             return res.status(400).json({ message: 'User Id is required.' });
//         }
//         if (!configname) {
//             return res.status(400).json({ message: 'Configuration Name is required.' });
//         }
//         if (!configtype) {
//             return res.status(400).json({ message: 'Configuration Type is required.' });
//         }
//         if (!parameter) {
//             return res.status(400).json({ message: 'Parameter is required.' });
//         }
//         if (!securitykey) {
//             return res.status(400).json({ message: 'Security Key is required.' });
//         }
//         if (!database) {
//             return res.status(400).json({ message: 'Database Name is required.' });
//         }
//         if (!databasetype) {
//             return res.status(400).json({ message: 'Database type is required.' });
//         }
//         if (!key) {
//             return res.status(400).json({ message: 'Access Key is required.' });
//         }

//         if (key !== apiKey) {
//             return res.status(400).json({ message: 'Unauthorized User. Contact the administrator.' });
//         }

//         // Check if the configuration already exists
//         const existConfig = await UserConfig.findOne({ $and: [{ userid }, { configname }, { configtype }, { database }, { databasetype },{parameter}] });
//         console.log("Existing configuration: ", existConfig);
//         if (existConfig) {
//             return res.status(400).json({ message: 'Configuration is already set up with the same details.' });
//         }

//         // Handle connection test if the configtype is 'baseUrl'
//         if (configtype === 'baseUrl') {
//             const end_point = '/odoo/connection';
//             const apiUrl = `${parameter}${end_point}?api_key=${encodeURIComponent(securitykey)}&db_name=${encodeURIComponent(database)}`;
//             console.log("Connection URL: ", apiUrl);

//             try {
//                 const response = await fetch(apiUrl);
//                 if (!response.ok) {
//                     throw new Error(`HTTP error! Status: ${response.status}`);
//                 }
//                 const data = await response.json();
//                 console.log('Connection successful:', data);
//                 if (data.code === '401') {
//                     return res.status(401).json({ message: data.message, code: 401 });
//                 }
//             } catch (error) {
//                 console.error('Error fetching data:', error);
//                 return res.status(500).json({ message: 'Failed to communicate with the given URL. Error: ' + error.message });
//             }
//         }

//         // Create and save the new user configuration
//         const newUserConfig = new UserConfig({ userid, configname, configtype, parameter, securitykey, database, databasetype });
//         await newUserConfig.save();
//         return res.status(201).json({ message: 'Configuration setup successfully', UserConfig: newUserConfig });

//     } catch (error) {
//         console.error('Error creating new User Config:', error);
//         return res.status(500).json({ message: 'Internal server error: ' + error.message });
//     }
// }
// new code for creating config
async function createUserConfig(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    console.log(
      "Full request body in create config for existing database: ",
      decryptedPayload
    );
    // console.log("Full request body in create config for existing database: ", req.body);
    const {
      userid,
      configname,
      configtype,
      parameter,
      securitykey,
      database,
      key,
      databasetype,
      midurl,
      license_key,
      client_rule_engine,
      odoo_version,
    } = decryptedPayload;

    // const { userid, configname, configtype, parameter, securitykey, database, key, databasetype ,license_key , client_rule_engine,midurl} = req.body;

    // Validation checks
    if (!userid) {
      return res.status(400).json({ message: "User Id is requireddddddd." });
    }
    if (!configname) {
      return res
        .status(400)
        .json({ message: "Configuration Name is required." });
    }
    if (!configtype) {
      return res
        .status(400)
        .json({ message: "Configuration Type is required." });
    }
    if (!parameter) {
      return res.status(400).json({ message: "Parameter is required." });
    }
    if (!securitykey) {
      return res.status(400).json({ message: "Security Key is required." });
    }
    if (!database) {
      return res.status(400).json({ message: "Database Name is required." });
    }
    if (!databasetype) {
      return res.status(400).json({ message: "Database type is required." });
    }
    if (!odoo_version) {
      return res.status(400).json({ message: "Odoo version is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (!license_key) {
      return res.status(400).json({ message: "License Key is required." });
    }

    if (key !== apiKey) {
      return res
        .status(400)
        .json({ message: "Unauthorized User. Contact the administrator." });
    }

    // Check if the configuration  license key is valid or not
    const existingSubscription = await Subscription.findOne({
      license_key: license_key,
    });
    console.log(" **** license_key obje", existingSubscription);
    if (!existingSubscription) {
      return res.status(400).json({
        message: "Invalid License key. ",
      });
    }

    if (existingSubscription) {
      const { current_status } = existingSubscription;
      console.log(" my license key is not expiring: ", current_status);
      if (!current_status) {
        return res
          .status(400)
          .json({ message: "User License Key is expired." });
      }
    }

    // Check if the configuration already exists
    const existConfig = await UserConfig.findOne({
      $and: [
        { userid },
        { configname },
        { configtype },
        { database },
        { databasetype },
        { parameter },
      ],
    });
    // console.log("Existing configuration: ", existConfig);
    if (existConfig) {
      return res.status(400).json({
        message: "Configuration is already set up with the same details.",
      });
    }

    // Handle connection test if the configtype is 'baseUrl'
    if (configtype === "baseUrl") {
      const end_point = "/odoo/connection";
      const apiUrl = `${parameter}${end_point}?api_key=${encodeURIComponent(
        securitykey
      )}&db_name=${encodeURIComponent(database)}`;
      // console.log("Connection URL: ", apiUrl);

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // console.log("Connection successful:", data);
        if (data.code === "401") {
          return res.status(401).json({ message: data.message, code: 401 });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({
          message:
            "Failed to communicate with the given URL. Error: " + error.message,
        });
      }
    }

    console.log(" chekcing whicjh databseetu pe: ", databasetype)
    // Create and save the new user configuration
    let owner = '' ;
    let repo  = '' ;
    let  branch = '' ;
    let  token = '' ;
    let accessToken = '' ;
    if(databasetype =='odoo.sh')
    {
      const local = localStorage.getItem(userid);
      console.log("hello we in local: " ,local);
      console.log("local.get owneraprse ", JSON.parse(local).owner);
      let local1 =  JSON.parse(local)
      owner  = local1.owner;
      repo  = local1.repo;
      branch = local1.branch;
      token = local1.token;
    }

    const newUserConfig = new UserConfig({
      userid,
      configname,
      configtype,
      parameter,
      securitykey,
      database,
      databasetype,
      midurl,
      license_key,
      client_rule_engine,
      odoo_version,
      owner : owner,
      repo: repo,
      branch : branch,
      accessToken : token,
    });
    await newUserConfig.save();
    console.log("###after saving new configuration ",newUserConfig)
    return res.status(201).json({
      message: "Configuration setup successfully",
      UserConfig: newUserConfig,
    });
  } catch (error) {
    console.error("Error creating new User Config:", error);
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// old working code ==================================================
// async function createUserConfigNewDatabase(req, res) {
//     try {
//         console.log("Full request body in create config for new database: ", req.body);
//         const { userid, username, configname, parameter, key, phone, useremail, company_name, message,database } = req.body;

//         // Validation checks
//         if (!userid) {
//             return res.status(400).json({ message: 'User Id is required.' });
//         }

//        /*  if (!company_name) {
//             return res.status(400).json({ message: 'Company Name is required.' });
//         }*/
//         if (!configname) {
//             return res.status(400).json({ message: 'Configuration Name is required.' });
//         }
//         // if (!parameter) {
//         //     return res.status(400).json({ message: 'Parameter is required.' });
//         // }
//         if (!key) {
//             return res.status(400).json({ message: 'Access Key is required.' });
//         }
//         if (key !== apiKey) {
//             return res.status(400).json({ message: 'Unauthorized User. Contact the administrator.' });
//         }

//         // Check if the configuration already exists
//         const databasetype = 'new';
//         // const database = company_name;
//         const configtype = 'baseUrl';
//         const source = 'react';

//         const existConfig = await UserConfig.findOne({ $and: [{ userid }, { configtype }, { database }, { databasetype }] });
//         console.log("Data already exists: ", existConfig);
//         if (existConfig) {
//             console.log("Already set up: ", existConfig);
//             return res.status(400).json({ message: 'Configuration is already set up with the same details.' });
//         }

//         // Handle the creation db for the user id:
//         try {
//             const contact_name = username;
//             const full_number = phone;
//             const email = useremail;
//             const company_name = database;
//             const formData = new URLSearchParams({
//                 source,
//                 contact_name,
//                 full_number,
//                 email,
//                 company_name,
//                 message
//             });

//             const flaskApiUrl = 'https://www.oflowai.com/create/oflow/db';      /*live url*/
//             // const flaskApiUrl = 'http://192.168.1.18:6007/create/oflow/db';  /*internal url*/
//             // const flaskApiUrl = 'http://192.168.1.18:6007/create/oflow/db';  /*lcoal rls*/
//             const response = await fetch(flaskApiUrl, {
//                 method: 'POST',
//                 body: formData,
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded'
//                 }
//             });

//             // Check if the response is JSON
//             const contentType = response.headers.get('Content-Type');
//             if (!response.ok || !contentType.includes('application/json')) {
//                 const text = await response.text(); // Read response as text
//                 console.error('Unexpected response from Flask API:', text);
//                 return res.status(500).json({ message: 'Error from Flask API, check server logs.' });
//             }

//             const data = await response.json();
//             console.log("****data response from Flask: ", data);
//             const [url, new_database_value] = data;

//             // Create and save the new user configuration
//             const securitykey = new_database_value;
//             const return_param = url
//             const return_ = url
//             const newUserConfig = new UserConfig({ userid, configname, configtype, parameter:return_param, securitykey, database, databasetype,isactive:true });
//             await newUserConfig.save();

//             // Send the successful response
//             return res.status(201).json({
//                 message: 'Configuration setup successfully',
//                 UserConfig: newUserConfig,
//                 redirectUrl: url
//             });

//         } catch (error) {
//             console.error('Error sending data to Flask API:', error);
//             return res.status(500).json({ message:  'Server is not running . '+ error.message });
//         }

//     } catch (error) {
//         console.error('Error creating new User Config:', error);
//         return res.status(500).json({ message: 'Internal server error: ' + error.message });
//     }
// }
// new code for new hutch create
async function createUserConfigNewDatabase(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    // console.log(
    //   "Full request body in create config for new database: ",
    //   decryptedPayload
    // );
    // console.log("Full request body in create config for new database: ", req.body);
    const {
      userid,
      username,
      configname,
      parameter,
      key,
      phone,
      useremail,
      company_name,
      message,
      database,
      midurl,
    } = decryptedPayload;
    // const { userid, username, configname, parameter, key, phone, useremail, company_name, message,database } = req.body;

    // Validation checks
    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }

    /*  if (!company_name) {
            return res.status(400).json({ message: 'Company Name is required.' });
        }*/
    if (!configname) {
      return res
        .status(400)
        .json({ message: "Configuration Name is required." });
    }
    // if (!parameter) {
    //     return res.status(400).json({ message: 'Parameter is required.' });
    // }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res
        .status(400)
        .json({ message: "Unauthorized User. Contact the administrator." });
    }

    // Check if the configuration already exists
    const databasetype = "new";
    // const database = company_name;
    const configtype = "baseUrl";
    const source = "react";

    const existConfig = await UserConfig.findOne({
      $and: [{ userid }, { configtype }, { database }, { databasetype }],
    });
    // console.log("Data already exists: ", existConfig);
    if (existConfig) {
      // console.log("Already set up: ", existConfig);
      return res.status(400).json({
        message: "Configuration is already set up with the same details.",
      });
    }

    // Handle the creation db for the user id:
    try {
      const contact_name = username;
      const full_number = phone;
      const email = useremail;
      const company_name = database;
      const formData = new URLSearchParams({
        source,
        contact_name,
        full_number,
        email,
        company_name,
        message,
      });

      const flaskApiUrl =
        "https://www.oflowai.com/create/oflow/db"; /*live url*/
      // const flaskApiUrl = 'http://192.168.1.18:6007/create/oflow/db';  /*internal url*/
      // const flaskApiUrl = 'http://192.168.1.18:6007/create/oflow/db';  /*lcoal rls*/
      const response = await fetch(flaskApiUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Check if the response is JSON
      const contentType = response.headers.get("Content-Type");
      if (!response.ok || !contentType.includes("application/json")) {
        const text = await response.text(); // Read response as text
        console.error("Unexpected response from Flask API:", text);
        return res
          .status(500)
          .json({ message: "Error from Flask API, check server logs." });
      }

      const data = await response.json();
      // console.log("****data response from Flask: ", data);
      const [url, new_database_value] = data;

      // Create and save the new user configuration
      const securitykey = new_database_value;
      const return_param = url;
      const return_ = url;
      const newUserConfig = new UserConfig({
        userid,
        configname,
        configtype,
        parameter: return_param,
        securitykey,
        database,
        databasetype,
        isactive: true,
      });
      await newUserConfig.save();

      // Send the successful response
      return res.status(201).json({
        message: "Configuration setup successfully",
        UserConfig: newUserConfig,
        redirectUrl: url,
      });
    } catch (error) {
      console.error("Error sending data to Flask API:", error);
      return res
        .status(500)
        .json({ message: "Server is not running . " + error.message });
    }
  } catch (error) {
    console.error("Error creating new User Config:", error);
    return res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

async function checkConfiguration(req, res) {
  try {
    const { userid, configtype, key } = req.body;
    // Validation checks
    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!configtype) {
      return res
        .status(400)
        .json({ message: "Configuration Type is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized User access contact to administrator.",
      });
    }

    const existConfig = await UserConfig.find({
      $and: [{ userid }, { configtype }],
    });
    // console.log(
    //   "Configuration aleardy setup for this user id and this type: ",
    //   existConfig
    // );
    if (existConfig) {
      return res.status(201).json({ existConfig });
    }
    res.status(200).json({ Object: "NO" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}
// old working code ==============================================
// async function fetchConfig(req, res) {
//   console.log("full request of fetch conig: ", req.body);
//   try {
//     const { userid, configtype, key } = req.body;
//     // Validation checks
//     if (!userid) {
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

//     const existConfig = await UserConfig.find({
//       $and: [{ userid, configtype }],
//     });
//     console.log(
//       "Configuration aleardy setup for this user id and this type: in fetch config ",
//       existConfig
//     );
//     if (existConfig) {
//       return res.status(201).json({ config: existConfig });
//     }
//     return res.status(404).json({ config: null });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for fetching config detail ============================
async function fetchConfig(req, res) {
  // console.log("full request of fetch conig: ", req.body);
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { userid, configtype, key } = decryptedPayload;
    // const { userid, configtype, key } = req.body;
    // Validation checks
    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User. Contact to administrator.",
      });
    }

    const existConfig = await UserConfig.find({
      $and: [{ userid, configtype }],
    });
    // console.log(
    //   "Configuration aleardy setup for this user id and this type: in fetch config ",
    //   existConfig
    // );
    if (existConfig) {
      return res.status(201).json({ config: existConfig });
    }
    return res.status(404).json({ config: null });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

// old woring code ====================================================
// async function fetchConfigActive(req, res) {
//   console.log("full request of fetch conig: ", req.body);
//   try {
//     const { userid, configtype, key } = req.body;
//     // Validation checks
//     if (!userid) {
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
//     const existConfig = await UserConfig.find({
//       $and: [{ userid, configtype, isactive: "true" }],
//     });
//     console.log(
//       "Configuration aleardy setup for this user id and this type: in fetch config ",
//       existConfig
//     );
//     if (existConfig) {
//       return res.status(201).json({ config: existConfig });
//     }
//     return res.status(404).json({ message: "No database" });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }
// new code for fetching all active databases ==============================
async function fetchConfigActive(req, res) {
  // console.log("full request of fetch conig: ", req.body);
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { userid, configtype, key } = decryptedPayload;
    // const { userid, configtype, key } = req.body;
    // Validation checks
    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User .Contact to administrator.",
      });
    }
    const existConfig = await UserConfig.find({
      $and: [{ userid, configtype, isactive: "true" }],
    });
    // console.log(
    //   "Configuration aleardy setup for this user id and this type: in fetch config ",
    //   existConfig
    // );
    if (existConfig) {
      return res.status(201).json({ config: existConfig });
    }
    return res.status(404).json({ message: "No database" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}




async function fetchConfigOne(req, res) {
  try {
    const { configid, userid, key } = req.body;
    // Validation checks

    if (!configid) {
      return res.status(400).json({ message: "Configuration Id is required." });
    }
    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User contact to administrator.",
      });
    }

    const filter = { _id: configid, userid: userid };
    const existConfig = await UserConfig.find({ $and: [filter] });
    // console.log(
    //   "Configuration aleardy setup for this user id and this type: ",
    //   existConfig
    // );
    if (existConfig) {
      return res.status(201).json({ config: existConfig });
    }
    return res.status(404).json({ config: null });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}




// odl working code ==============================================
// async function updateUserConfig(req, res) {
//   try {
//     const { configid, userid, key } = req.body;
//     console.log("config  update rquest: ", req.body);
//     if (!configid) {
//       return res.status(400).json({ message: "Configuration Id is required." });
//     }
//     if (!userid) {
//       return res.status(400).json({ message: "User Id is required." });
//     }

//     if (!key) {
//       return res.status(400).json({ message: "Access Key  is required." });
//     }

//     if (key != apiKey) {
//       return res
//         .status(400)
//         .json({
//           message: "Unauthorized access User contact to administrator.",
//         });
//     }

//     // if (!configtype) {
//     // return res.status(400).json({ message: 'Configuration Type is required.' });
//     // }

//     // if (!parameter) {
//     // return res.status(400).json({ message: ' Url  required.' });
//     // }

//     // if (!securitykey) {
//     // return res.status(400).json({ message: 'Secuirty key  is required.' });
//     // }

//     // if (!database) {
//     // return res.status(400).json({ message: 'Database name is required.' });
//     // }
//     // if (!configname || !parameter) {
//     // return res.status(400).json({ message: '' });
//     // }
//     // const filter = { userid: userid ,configtype: configtype};
//     const filter = { _id: configid, userid: userid };
//     const update = {
//       configname: req.body.configname,
//       parameter: req.body.parameter,
//       securitykey: req.body.securitykey,
//       database: req.body.database,
//     };
//     const options = { new: true };

//     const updatedUser = await UserConfig.findOneAndUpdate(
//       filter,
//       update,
//       options
//     );
//     if (!updatedUser) {
//       return res
//         .status(404)
//         .json({
//           error: "NO Configuration found for this user id with given criteria.",
//         });
//     }
//     res
//       .status(201)
//       .json({
//         message: "User Configuration  Updated successfully.",
//         updatedUser,
//       });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }



// new code for config update =====================================
async function updateUserConfig(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const {
      configid,
      userid,
      key,
      license_key,
      client_rule_engine,
      odoo_version,
    } = decryptedPayload;
    // const { configid, userid, key } = req.body;
    // console.log("config  update rquest: ", decryptedPayload);
    console.log("config  update rquest: ", decryptedPayload);

    if (!configid) {
      return res.status(400).json({ message: "Configuration Id is required." });
    }

    if (!license_key) {
      return res.status(400).json({ message: "License Id is required." });
    }
    if (!odoo_version) {
      return res.status(400).json({ message: "Odoo version is required." });
    }

    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User contact to administrator.",
      });
    }

    // ***fetch license key ***************
    const existingSubscription = await Subscription.findOne({
      license_key: license_key,
    });
    console.log(" **** license_key obje", existingSubscription);
    if (!existingSubscription) {
      return res.status(400).json({
        message: "Invalid License key. ",
      });
    }

    if (existingSubscription) {
      const { current_status } = existingSubscription;
      console.log(
        " update user config api my license key is not expiring: ",
        current_status
      );
      if (!current_status) {
        return res
          .status(400)
          .json({ message: "User License Key is expired." });
      }
    }

    // ***fetch license key ***************

    // const filter = { userid: userid ,configtype: configtype};
    const filter = { _id: configid, userid: userid };
    const update = {
      configname: decryptedPayload.configname,
      parameter: decryptedPayload.parameter,
      securitykey: decryptedPayload.securitykey,
      database: decryptedPayload.database,
      license_key: decryptedPayload.license_key,
      client_rule_engine: decryptedPayload.client_rule_engine,
      odoo_version: decryptedPayload.odoo_version,
    };
    // const update = {
    //   configname: req.body.configname,
    //   parameter: req.body.parameter,
    //   securitykey: req.body.securitykey,
    //   database: req.body.database,
    // };
    const options = { new: true };

    const updatedUser = await UserConfig.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updatedUser) {
      return res.status(404).json({
        error: "NO Configuration found for this user id with given criteria.",
      });
    }
    res.status(201).json({
      message: "User Configuration  Updated successfully.",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}


// old working code ================================================
// async function updateUserConfigSatus(req, res) {
//   try {
//     const { configid, userid, status, key } = req.body;
//     console.log("config  update rquest updateUserConfigSatus: ", req.body);

//     if (!configid) {
//       return res.status(400).json({ message: "Configuration Id is required." });
//     }

//     if (typeof status !== "boolean") {
//       return res.status(400).json({ message: "Status is Required." });
//     }

//     if (!userid) {
//       return res.status(400).json({ message: "User Id is required." });
//     }

//     if (!key) {
//       return res.status(400).json({ message: "Access Key  is required." });
//     }

//     if (key != apiKey) {
//       return res
//         .status(400)
//         .json({
//           message: "Unauthorized access User contact to administrator.",
//         });
//     }

//     // let updateAll = false;
//     // const filterall = {userid:userid};
//     // const updateall = { isactive: false}
//     // const updatedUserall =  await UserConfig.updateMany(filterall, updateall);
//     // updateAll=true
//     // if(!updatedUserall){
//     //     return res.status(404).json({ message: 'NO Configuration found for this user id with given criteria.' });
//     // }

//     // if(updateAll){
//     console.log("before if : ", typeof req.body.status);
//     if (true) {
//       // update all object false

//       const filter = { _id: configid };
//       console.log("fielste :", filter);
//       const update = { isactive: req.body.status };
//       console.log("udpate: ", update);
//       const options = { new: false };
//       console.log(" request:  ", req.body.status);
//       const updatedUser = await UserConfig.findOneAndUpdate(
//         filter,
//         update,
//         options
//       );
//       console.log(" fond to udate;or not: ", updatedUser);
//       if (!updatedUser) {
//         return res
//           .status(404)
//           .json({
//             message:
//               "NO Configuration found for this user id with given criteria.",
//           });
//       }
//       res
//         .status(201)
//         .json({
//           message: "User Configuration  Updated successfully.",
//           updatedUser,
//         });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" + error });
//   }
// }



// new code for updating config status ============================
async function updateUserConfigSatus(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { configid, userid, status, key } = decryptedPayload;
    // const { configid, userid, status, key } = req.body;
    // console.log(
    //   "config  update rquest updateUserConfigSatus: ",
    //   decryptedPayload
    // );
    // console.log("config  update rquest updateUserConfigSatus: ", req.body);

    if (!configid) {
      return res.status(400).json({ message: "Configuration Id is required." });
    }

    if (typeof status !== "boolean") {
      return res.status(400).json({ message: "Status is Required." });
    }

    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User contact to administrator.",
      });
    }

    // let updateAll = false;
    // const filterall = {userid:userid};
    // const updateall = { isactive: false}
    // const updatedUserall =  await UserConfig.updateMany(filterall, updateall);
    // updateAll=true
    // if(!updatedUserall){
    //     return res.status(404).json({ message: 'NO Configuration found for this user id with given criteria.' });
    // }

    // if(updateAll){
    // console.log("before if : ", typeof decryptedPayload.status);
    // console.log("before if : ", typeof req.body.status);
    if (true) {
      // update all object false

      const filter = { _id: configid };
      // console.log("fielste :", filter);
      const update = { isactive: decryptedPayload.status };
      // const update = { isactive: req.body.status };
      // console.log("udpate: ", update);
      const options = { new: false };
      // console.log(" request:  ", decryptedPayload.status);
      // console.log(" request:  ", req.body.status);
      const updatedUser = await UserConfig.findOneAndUpdate(
        filter,
        update,
        options
      );
      // console.log(" fond to udate;or not: ", updatedUser);
      if (!updatedUser) {
        return res.status(404).json({
          message:
            "NO Configuration found for this user id with given criteria.",
        });
      }
      res.status(201).json({
        message: "User Configuration  Updated successfully.",
        updatedUser,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}



// old working code =========================================
// async function deleteUserConfig(req, res) {
//   try {
//     const { configid, userid, key } = req.body;

//     // Validate input
//     if (!userid) {
//       return res.status(400).json({ message: "User Id is required." });
//     }
//     if (!configid) {
//       return res.status(400).json({ message: "Configuration Id is required." });
//     }

//     if (!key) {
//       return res.status(400).json({ message: "Access Key is required." });
//     }

//     if (key != apiKey) {
//       return res.status(400).json({
//         message: "Unauthorized access User contact to administrator.",
//       });
//     }

//     // Define filter criteria
//     const filter = { _id: configid, userid: userid };

//     // Perform the delete operation
//     const result = await UserConfig.findOneAndDelete(filter);

//     // Check if a document was deleted
//     if (!result) {
//       return res.status(404).json({
//         error:
//           "No configuration found for this user ID with the given criteria.",
//       });
//     }

//     // Respond with success message
//     res
//       .status(200)
//       .json({ message: "User Configuration deleted successfully." });
//   } catch (error) {
//     // Handle errors
//     res
//       .status(500)
//       .json({ message: "Internal server error: " + error.message });
//   }
// }


// new code for delete config detail ==============================
async function deleteUserConfig(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { configid, userid, key } = decryptedPayload;
    // const { configid, userid, key } = req.body;

    // Validate input
    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }
    if (!configid) {
      return res.status(400).json({ message: "Configuration Id is required." });
    }

    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User contact to administrator.",
      });
    }

    // Define filter criteria
    const filter = { _id: configid, userid: userid };

    // Perform the delete operation
    const result = await UserConfig.findOneAndDelete(filter);

    // Check if a document was deleted
    if (!result) {
      return res.status(404).json({
        error:
          "No configuration found for this user ID with the given criteria.",
      });
    }

    // Respond with success message
    res
      .status(200)
      .json({ message: "User Configuration deleted successfully." });
  } catch (error) {
    // Handle errors
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// connect odoo instanace node API controller
// async function authenticate_odoo_user(req , res) {
//      try {
//         const { configid, userid, key} = req.body;
//         // Validation checks

//         if (!configid) {
//             return res.status(400).json({ message: 'Configuration Id is required.' });
//         }
//         if (!userid) {
//             return res.status(400).json({ message: 'User Id is required.' });
//         }

//         if (!key) {
//              return res.status(400).json({ message: 'Access Key  is required.' });
//                 }

//         if (key!=apiKey) {
//              return res.status(400).json({ message: 'Unauthorized access User contact to administrator.' });
//                 }

//         const filter = { _id : configid , userid: userid,  };
//         const existConfig = await UserConfig.find({ $and: [filter] });
//         console.log("Configuration aleardy setup for this user id and this type: ", existConfig)
//         // hit odoo api here to call api

//         // end here
//         if (existConfig) {
//             return res.status(201).json({ redirectUrl: existConfig[0].parameter});
//         }
//         return res.status(404).json({ config: null});
//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error' + error });
//     }
// }

// old working code ============================================
// async function authenticate_odoo_user(req, res) {
//   try {

//     const { configid, userid, key } = req.body;
//     // Validation checks

//     if (!configid) {
//       return res.status(400).json({ message: "Configuration Id is required." });
//     }
//     if (!userid) {
//       return res.status(400).json({ message: "User Id is required." });
//     }
//     if (!key) {
//       return res.status(400).json({ message: "Access Key is required." });
//     }
//     if (key !== apiKey) {
//       return res.status(401).json({
//         message: "Unauthorized access. User contact to administrator.",
//       });
//     }

//     const filter = { _id: configid, userid: userid };
//     const existConfig = await UserConfig.find(filter);
//     console.log(
//       "Configuration already setup for this user id and this type: ",
//       existConfig
//     );

//     // Hit Odoo API here to call API
//     if (true) {
//       const odooApiUrl =
//         existConfig[0].parameter + "/process/authenticate/user"; // Replace with your Odoo API URL
//       console.log(" **********888 odoo api to authenticate user: ", odooApiUrl);
//       const odooCredentials = {
//         url: existConfig[0].parameter,
//         username: "o2b_user",
//       };
//       const headers = {
//         "Content-Type": "application/json",
//         "X-Security-Key": key,
//       };

//       const response = await fetch(odooApiUrl, {
//         method: "POST",
//         headers: headers,
//         body: JSON.stringify(odooCredentials),
//       });

//       console.log(" *** full reponse of authenticate odoo user; ", response);
//       if (!response.ok) {
//         const errorData = await response.json();
//         return res.status(500).json({
//           message: "Failed to authenticate with Odoo",
//           error: errorData,
//         });
//       }
//       const data = await response.json();
//       console.log("Odoo response:", data);

//       // End here
//       return res.status(200).json({ redirectUrl: existConfig[0].parameter });
//     }
//     // return res.status(404).json({ config: null });
//   } catch (error) {
//     console.log(" ****error ", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error: " + error.message });
//   }
// }



// new code for odoo connect ==================================
async function authenticate_odoo_user(req, res) {
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { configid, userid, key } = decryptedPayload;
    // const { configid, userid, key } = req.body;
    // Validation checks

    if (!configid) {
      return res.status(400).json({ message: "Configuration Id is required." });
    }
    if (!userid) {
      return res.status(400).json({ message: "User Id is required." });
    }
    if (!key) {
      return res.status(400).json({ message: "Access Key is required." });
    }
    if (key !== apiKey) {
      return res.status(401).json({
        message: "Unauthorized access. User contact to administrator.",
      });
    }

    const filter = { _id: configid, userid: userid };
    const existConfig = await UserConfig.find(filter);
    // console.log(
    //   "Configuration already setup for this user id and this type: ",
    //   existConfig
    // );

    // Hit Odoo API here to call API
    if (true) {
      const odooApiUrl =
        existConfig[0].parameter + "/process/authenticate/user"; // Replace with your Odoo API URL
      // console.log(" **********888 odoo api to authenticate user: ", odooApiUrl);
      const odooCredentials = {
        url: existConfig[0].parameter,
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

      // console.log(" *** full reponse of authenticate odoo user; ", response);
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(500).json({
          message: "Failed to authenticate with Odoo",
          error: errorData,
        });
      }
      const data = await response.json();
      // console.log("Odoo response:", data);

      // End here
      return res.status(200).json({ redirectUrl: existConfig[0].parameter });
    }
    // return res.status(404).json({ config: null });
  } catch (error) {
    console.log(" ****error ", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
}

// method for fetch all configurations
async function fetchAllConfig(req, res) {
  // console.log("full request of fetch conig: ", req.body);
  try {
    const encryptedData = req.body.data;
    const decryptedPayload = Service.decryptData(encryptedData, payloadSecret);
    const { key } = decryptedPayload;

    if (!key) {
      return res.status(400).json({ message: "Access Key  is required." });
    }

    if (key != apiKey) {
      return res.status(400).json({
        message: "Unauthorized access User. Contact to administrator.",
      });
    }

    const existConfig = await UserConfig.find();
    if (existConfig) {
      return res.status(201).json({ configs: existConfig });
    }
    return res.status(404).json({ config: null });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" + error });
  }
}

module.exports = {
  createUserConfig,
  checkConfiguration,
  updateUserConfig,
  deleteUserConfig,
  fetchConfig,
  updateUserConfigSatus,
  fetchConfigOne,
  createUserConfigNewDatabase,
  fetchConfigActive,
  authenticate_odoo_user,
  fetchAllConfig,
};
