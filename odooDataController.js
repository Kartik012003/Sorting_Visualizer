const Odoo = require("../models/odooData");
const Service = require("../services/services");
const Process = require("../models/process");
const UserConfig = require("../models/userConfig");
const baseUrl = process.env.ODOO_BASE_URL;
const apiKey = process.env.API_KEY;

async function fetchGroups(req, res) {
  // console.log("full request o odoo/groups", req.query);
  // fetch process backend url start
  if (!req.query.database) {
    return res.status(400).json({ message: "database id is required." });
  }
  if ("null" == req.query.database) {
    return res.status(400).json({ message: "database can not be null." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }
  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }
  let object_id = req.query.database.trim();
  let api_key = req.query.api_key.trim();

  // search config table
  const existConfig = await UserConfig.findOne({
    $and: [{ _id: object_id.trim() }, { isactive: true }],
  });
  // console.log("Existing configuration: ", existConfig);
  if (!existConfig) {
    return res.status(400).json({ message: "Configuration is not active" });
  }

  let odooBaseUrl;
  if (existConfig && existConfig.parameter) {
    odooBaseUrl = existConfig.parameter;
  }

  // fetch process backend url end
  const end_point = "/o2b/groups";
  const apiUrl = `${odooBaseUrl}${end_point}`;
  // console.log("complete url in fetch groups: ", apiUrl);
  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Fetched data:", data);
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}

async function fetchUsers(req, res) {
  // const base_url= 'http://localhost:8086'
  // console.log("full rewquesrt o odoo/groups", req.query);
  // fetch process backend url start
  if (!req.query.process_id) {
    return res.status(400).json({ message: "Process Id is required." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }
  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }
  let process_id = req.query.process_id.trim();
  let api_key = req.query.api_key.trim();

  // search process table
  const existProcess = await Process.findOne({ $or: [{ process_id }] });
  if (!existProcess) {
    // console.log("existing user : ", existProcess);
    return res.status(400).json({ message: "Process not exist." });
  }

  // search config table
  const existConfig = await UserConfig.findOne({
    $and: [
      { _id: existProcess.database_obj.trim() },
      { isactive: true },
      { parameter: existProcess.database_url },
    ],
  });
  // console.log("Existing configuration: ", existConfig);
  if (!existConfig) {
    return res.status(400).json({ message: "Configuration is not active" });
  }

  if (!existProcess.database_url || !existProcess.database_obj) {
    return res
      .status(400)
      .json({ message: "Process is not bind to acitve database." });
  }

  let odooBaseUrl;
  if (existProcess.database_url == existConfig.parameter) {
    odooBaseUrl = existProcess.database_url;
  }
  // fetch process backend url end
  const end_point = "/o2b/users";
  const apiUrl = `${odooBaseUrl}${end_point}`;
  // console.log("fetching .o2b./usrs", apiUrl);

  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Fetched data:", data);
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}

// async function fetchModels(req, res) {
//   // const base_url= 'http://localhost:8086'
//   // console.log("full rewquesrt o odoo/model", req.query);
//   // fetch process backend url start
//   if (!req.query.process_id) {
//     return res.status(400).json({ message: "Process Id is required." });
//   }

//   if (!req.query.api_key) {
//     return res.status(400).json({ message: "Unauthorized access." });
//   }

//   if (req.query.api_key != apiKey) {
//     return res.status(400).json({ message: "Unauthorized access token." });
//   }

//   let process_id = req.query.process_id.trim();
//   let api_key = req.query.api_key.trim();

//   // search process table
//   const existProcess = await Process.findOne({ $or: [{ process_id }] });

//   if (!existProcess) {
//     // console.log("existing user : ", existProcess);
//     return res.status(400).json({ message: "Process not exist." });
//   }

//   // console.log("*************** process object id:", existProcess.database_obj);
//   // search config table
//   const existConfig = await UserConfig.findOne({
//     $and: [
//       { _id: existProcess.database_obj.trim() },
//       { isactive: true },
//       { parameter: existProcess.database_url },
//     ],
//   });
//   // console.log("Existing configuration: ", existConfig);

//   if (!existConfig) {
//     return res.status(400).json({ message: "Configuration is not active" });
//   }

//   if (!existProcess.database_url || !existProcess.database_obj) {
//     return res
//       .status(400)
//       .json({ message: "Process is not bind to acitve database." });
//   }

//   let odooBaseUrl;
//   if (existProcess.database_url == existConfig.parameter) {
//     odooBaseUrl = existProcess.database_url;
//   }
//   // fetch process backend url end

//   const end_point = "/o2b/models";
//   const apiUrl = `${odooBaseUrl}${end_point}`;
//   // console.log("fetching /o2b/models", apiUrl);
//   try {
//     fetch(apiUrl)
//       .then((response) => {
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         return response.json();
//       })
//       .then((data) => {
//         // console.log("Fetched data:", data);
//         res.status(201).json({ data: data });
//       })
//       .catch((error) => {
//         console.error("Error fetching data:", error);
//         res.status(500).json({ message: "Internal server error ." + error });
//       });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error ." + error });
//   }
// }
async function fetchModels(req, res) {
  // const base_url= 'http://localhost:8086'
  // console.log("full rewquesrt o odoo/model", req.query);
  // fetch process backend url start
  // if (!req.query.process_id) {
  //   return res.status(400).json({ message: "Process id is required." });
  // }

  if (!req.query.database_url) {
    return res.status(400).json({ message: "Database url is required." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }

  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }

  // let process_id = req.query.process_id.trim();
  let api_key = req.query.api_key.trim();

  // search process table
  // const existProcess = await Process.findOne({ $or: [{ process_id }] });

  // if (!existProcess) {
  //   // console.log("existing user : ", existProcess);
  //   return res.status(400).json({ message: "Process not exist." });
  // }

  // console.log("*************** process object id:", existProcess.database_obj);
  // search config table
  // const existConfig = await UserConfig.findOne({
  //   $and: [
  //     { _id: existProcess.database_obj.trim() },
  //     { isactive: true },
  //     { parameter: existProcess.database_url },
  //   ],
  // });
  // console.log("Existing configuration: ", existConfig);

  // if (!existConfig) {
  //   return res.status(400).json({ message: "Configuration is not active" });
  // }

  // if (!existProcess.database_url || !existProcess.database_obj) {
  //   return res
  //     .status(400)
  //     .json({ message: "Process is not bind to acitve database." });
  // }

  // let odooBaseUrl;
  // if (existProcess.database_url == existConfig.parameter) {
  //   odooBaseUrl = existProcess.database_url;
  // }
  // fetch process backend url end
  console.log("req.query::: ", req.query);
  console.log("req.query.database_url::: ", req.query.database_url);

  const end_point = "/o2b/models";
  // const apiUrl = `${req.query.process_id}${end_point}`;
  const apiUrl = `${req.query.database_url}${end_point}`;
  // console.log("fetching /o2b/models", apiUrl);
  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Fetched data:", data);
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}

async function fetchFields(req, res) { 
  // console.log("full rewquesrt o odoo/fields", req.query);
  // fetch process backend url start
  // if (!req.query.process_id) {
  //   return res.status(400).json({ message: "Process Id is required." });
  // }
  if (!req.query.database_url) {
    return res.status(400).json({ message: "Database url is required." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }
  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }

  const model = req.query.model; // Retrieve model parameter from query string
  if (!model) {
    return res.status(400).json({ message: "Model parameter is required." });
  }
  // let process_id = req.query.process_id.trim();
  let api_key = req.query.api_key.trim();

  // search process table
  // const existProcess = await Process.findOne({ $or: [{ process_id }] });
  // if (!existProcess) {
  //   // console.log("existing user : ", existProcess);
  //   return res.status(400).json({ message: "Process not exist." });
  // }

  // search config table
  // const existConfig = await UserConfig.findOne({
  //   $and: [
  //     { _id: existProcess.database_obj.trim() },
  //     { isactive: true },
  //     { parameter: existProcess.database_url },
  //   ],
  // });
  // console.log("Existing configuration: ", existConfig);
  // if (!existConfig) {
  //   return res.status(400).json({ message: "Configuration is not active" });
  // }

  // if (!existProcess.database_url || !existProcess.database_obj) {
  //   return res
  //     .status(400)
  //     .json({ message: "Process is not bind to acitve database." });
  // }

  // let odooBaseUrl;
  // if (existProcess.database_url == existConfig.parameter) {
  //   odooBaseUrl = existProcess.database_url;
  // }

  // fetch process backend url end

  const end_point = "/o2b/fields";
  const apiUrl = `${req.query.database_url}${end_point}?model=${model}`;
  // console.log("fetching /o2b/fields", apiUrl);

  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Fetched data:", data);
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}

async function fetchModelFields(req, res) {
  // console.log("full rewquesrt o odoo/fields", req.query);
  // fetch process backend url start
  // if (!req.query.process_id) {
  //   return res.status(400).json({ message: "Process Id is required." });
  // }
  if (!req.query.database_url) {
    return res.status(400).json({ message: "Database url is required." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }
  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }

  const model = req.query.model; // Retrieve model parameter from query string
  if (!model) {
    return res.status(400).json({ message: "Model parameter is required." });
  }
  // let process_id = req.query.process_id.trim();
  let api_key = req.query.api_key.trim();

  // search process table
  // const existProcess = await Process.findOne({ $or: [{ process_id }] });
  // if (!existProcess) {
  //   // console.log("existing user : ", existProcess);
  //   return res.status(400).json({ message: "Process not exist." });
  // }

  // search config table
  // const existConfig = await UserConfig.findOne({
  //   $and: [
  //     { _id: existProcess.database_obj.trim() },
  //     { isactive: true },
  //     { parameter: existProcess.database_url },
  //   ],
  // });
  // console.log("Existing configuration: ", existConfig);
  // if (!existConfig) {
  //   return res.status(400).json({ message: "Configuration is not active" });
  // }

  // if (!existProcess.database_url || !existProcess.database_obj) {
  //   return res
  //     .status(400)
  //     .json({ message: "Process is not bind to acitve database." });
  // }

  // let odooBaseUrl;
  // if (existProcess.database_url == existConfig.parameter) {
  //   odooBaseUrl = existProcess.database_url;
  // }

  // fetch process backend url end

  const end_point = "/o2b/field";
  const apiUrl = `${req.query.database_url}${end_point}?model=${model}`;
  // console.log("fetching /o2b/fields", apiUrl);
  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Fetched data:", data);
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}
async function fetchCategory(req, res) {
  // console.log("full request o odoo/category", req.query);
  // fetch process backend url start
  if (!req.query.database) {
    return res.status(400).json({ message: "database id is required." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }
  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }
  let object_id = req.query.database.trim();
  let api_key = req.query.api_key.trim();

  // search config table
  const existConfig = await UserConfig.findOne({
    $and: [{ _id: object_id.trim() }, { isactive: true }],
  });
  // console.log("Existing configuration: ", existConfig);
  if (!existConfig) {
    return res.status(400).json({ message: "Configuration is not active" });
  }

  let odooBaseUrl;
  if (existConfig && existConfig.parameter) {
    odooBaseUrl = existConfig.parameter;
  }

  // fetch process backend url end
  const end_point = "/o2b/category";
  const apiUrl = `${odooBaseUrl}${end_point}`;
  // console.log("fetching /o2b/category", apiUrl);
  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Fetched data:", data);
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}

async function fetchModelsBydbId(req, res) {
  // const base_url= 'http://localhost:8086'
  // console.log("full rewquesrt o odoo/model", req.query);
  // fetch process backend url start
  if (!req.query.database_id) {
    return res.status(400).json({ message: "Process Id is required." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }

  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }

  let database_id = req.query.database_id.trim();
  let api_key = req.query.api_key.trim();

  // // search process table
  // const filter = { _id: database_id};
  // const existConfig = await UserConfig.find({ $and: [filter] });

  // if (!existConfig) {
  //     console.log("existing user : ", existProcess)
  //     return res.status(400).json({ message: 'User config  not exist.' });
  // }

  // search config table
  const existConfig = await UserConfig.findOne({
    $and: [{ _id: database_id }, { isactive: true }],
  });
  if (!existConfig) {
    return res.status(400).json({ message: "Configuration is not active" });
  }

  let odooBaseUrl = existConfig.parameter;

  const end_point = "/o2b/models";
  const apiUrl = `${odooBaseUrl}${end_point}`;
  //   console.log("fetching /o2b/models", apiUrl);
  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Fetched data:", data);
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}

async function fetchModelFieldsWithoutProcessId(req, res) {
  // fetch process backend url start
  if (!req.query.database_id) {
    return res.status(400).json({ message: "database_id Id is required." });
  }

  if (!req.query.api_key) {
    return res.status(400).json({ message: "Unauthorized access." });
  }
  if (req.query.api_key != apiKey) {
    return res.status(400).json({ message: "Unauthorized access token." });
  }

  const model = req.query.model; // Retrieve model parameter from query string
  if (!model) {
    return res.status(400).json({ message: "Model parameter is required." });
  }
  let api_key = req.query.api_key.trim();
  let database_id = req.query.database_id;

  // search config table
  const existConfig = await UserConfig.findOne({
    $and: [{ _id: database_id }, { isactive: true }],
  });

  if (!existConfig) {
    return res.status(400).json({ message: "Configuration is not active" });
  }

  let odooBaseUrl = existConfig.parameter;
  const end_point = "/o2b/field";
  const apiUrl = `${odooBaseUrl}${end_point}?model=${model}`;

  try {
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        res.status(201).json({ data: data });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Internal server error ." + error });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error ." + error });
  }
}

module.exports = {
  fetchGroups,
  fetchUsers,
  fetchModels,
  fetchFields,
  fetchCategory,
  fetchModelFields,
  fetchModelsBydbId,
  fetchModelFieldsWithoutProcessId,
};
