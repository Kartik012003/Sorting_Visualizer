const jwt = require("jsonwebtoken");
const Storage = require("../models/storage");
const Config = require("../models/userConfig");
const apiKey = process.env.API_KEY;
const payloadSecret = process.env.NODE_APP_PAYLOAD_SECURITY_KEY;
const baseUrl = process.env.LEAD_POST_URL;
const crypto = require("crypto");
const Session = require("../models/session");
const User = require("../models/user");
const Service = require('../services/services');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET_KEY = process.env.CLIENT_SECRET_KEY;
const default_path = process.env.DEFAULT_MODULE_PATH
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { LocalStorage } = require('node-localstorage')

let GITHUB_TOKEN = '';
let OWNER = '';
let REPO = '';
let BRANCH = '';
let FOLDER_PATH = '';
let headers = {}
let githubApiBase = ''
let MODULE_FOLDER = ''
const localStorage = new LocalStorage('./oflow');

async function autherizeOooosh(req, res) {
    try {
        const { user_id , type} = req.query; // Use req.query for GET request parameters
        console.log("We are in OdooSh validation", req.body, "params:", req.params, "query:", req.query);

        if (!type) {
                return res.status(400).json({ message: 'Screen Type is missing..' });
            }
        
        if(type=='login')
        {
            console.log(" ** we in login block")
            const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&state=${type}&scope=user%20user:email`;
            res.status(200).json({ message: githubUrl }); 


        }
        // if(type == 'register')
        // {
        //     console.log(" ** we in registration block")
        //     const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&state=${type}&scope=user%20user:email`;
        //     res.status(200).json({ message: githubUrl }); 
        // }

        if(type == 'authorize')
        {
            console.log(" ** we in autheriztion block")
            if (!user_id) {
                return res.status(400).json({ message: 'Unauthorized access. User ID is missing.' });
            }
            const user = await User.findOne({ userid: String(user_id) }); 
            console.log("User:", user);
            if (!user) {
                return res.status(404).json({ message: 'No User ID found for this action.' });
            }
            // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email`;
            // for gituhub repos read and wirte
            // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=repo`;
            // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email,repo`;
            // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email,repo,admin:repo_hook`;
            // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email,repo,admin:repo_hook,read:org,write:org`;

            const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=user,repo,admin:org,admin:repo_hook,admin:public_key,admin:org_hook&type=${encodeURIComponent(type)}`;
            res.status(200).json({ message: githubUrl }); // Use 200 for successful responses
        }

    } catch (error) {
        console.error("Error in OdooSh authorization:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
}



async function getgitCode(req, res) {
    try {
        const { user_id ,git_code,type} = req.query; 
        console.log("We are in OdooSh validation", req.body, "params:", req.params, "query:", req.query);


        if (!type) {
            return res.status(400).json({ message: 'Screen type is missing.' });
        }
        
        if(type =='login')
        {
            const authUrl = 'https://github.com/login/oauth/access_token';
            const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Accept'        : 'application/json',
                'Content-Type'  : 'application/json'
            },
            body: JSON.stringify({
                client_id       : CLIENT_ID,
                client_secret   : CLIENT_SECRET_KEY,
                code: git_code,
                // redirect_uri: 'http://localhost:3000/github'
            })
            });
            const data = await response.json();
            const  {access_token,token_type,scope} = data
            console.log(" we in login")
            
            if(access_token)
            {

            // const headers = {
            // Authorization: `Bearer ${access_token}`,
            // Accept: "application/vnd.github.v3+json",
            // };
            console.log(" access tokern ::::::::;;;; in login screen", access_token)
            // const userRes = await fetch('https://api.github.com/user', {
            // user detail
            const userRes = await fetch('https://api.github.com/user', {
            method: 'GET',
            headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
            }
            });
            const userData = await userRes.json();
            const emailRes = await fetch('https://api.github.com/user/emails', {
            method: 'GET',
            headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
            }
            });
            const userEmail = await emailRes.json();
            if (userRes.status === 401 || emailRes.status === 401) {
                console.log("Invalid or expired token. Please re-authenticate.");
                let message = userRes
                return res.status(404).json({ message: 'Unauthorized access. Expired access token. re-authenticate again.' ,code:600});

            }
            else
            {
                await sleep(4000);
                // console.log("**** userData" ,userData)
                // console.log("**** user email " ,userEmail)
                console.log(" user email data email ", userEmail[0].email)
                console.log(" user email data email ", userEmail[0].verified)
                console.log("user data login ", userData.login)
                console.log("user data login ", userData.name)
                console.log("user data login ", userData.company)
                console.log("user data login ", userData.type)
               

                githubEmail = userEmail[0].email || ''
                githubUser = userData.login || userData.name
                githubCompany = userData.company || 'Github'
                githubPass = userData.id || 'Github'
               
                // check usr is exist with email id then login successfully otherwise create user 
                const user = await User.findOne({ email: String(githubEmail) }); 
                console.log("User found status : ", user);

                if (!user) { 
                    // insert new user in database and create session for login and redirect to dashboard
                    const temp = {
                        email:githubEmail,
                        password: githubPass
                    }
                    dynamic_user_id = await Service.generate_user_key(temp)
                    const newUser = new User({
                    userid      : dynamic_user_id,
                    username    : githubUser,
                    email       : githubEmail, 
                    password    : githubPass,
                    company     : githubCompany,
                    phone       : ''
                 });
                    await newUser.save();
                    console.log(" github user successfylly connected")
                    // start code for sending mail to download document
                     const mailResult = Service.sendMail(githubEmail, '', githubUser, "post_registration");
                    // end here 

                    return res.status(201).json({ message: 'New User has been Created Successfully.', email: githubEmail,password:githubPass,code:601 });

                }
                else
                {
                    console.log("*** user is exist :", )
                    return res.status(201).json({ message: 'New User has been Created Successfully.', email: user.email,password:user.password,code:601 });

                }
            }
            }
        
            // return res.status(200).json({ message: 'Login Successfull.',code:601 }); 
        }

        // if(type==='register')
        // {

        //     console.log(" we in registriona")

        //     return res.status(200).json({ message: 'Registration Successfull.',code:602 }); 
        // }

        if(type==='authorize')
        {
        if (!user_id) {
            console.log(" yer sthis ilin ie serr;")
            return res.status(400).json({ message: 'Unauthorized access. User ID is missing.' });
        }
        if (!git_code) {
            return res.status(400).json({ message: 'Unauthorized access. Code is missing.' });
        }
        const user = await User.findOne({ userid: String(user_id) }); 
        console.log("User:", user);
        
        if (!user) { // `findOne` returns null if no user is found
            return res.status(404).json({ message: 'No User ID found for this action.' });
        }
        // START CODE FOR GET ACCESS TOCKEN
        const authUrl = 'https://github.com/login/oauth/access_token';
        let newAccessTocker ;
        if(user.access_token)
        {
            newAccessTocker = user.access_token;
        }
        else
        {
            const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Accept'        : 'application/json',
                'Content-Type'  : 'application/json'
            },
            body: JSON.stringify({
                client_id       : CLIENT_ID,
                client_secret   : CLIENT_SECRET_KEY,
                code: git_code,
                // redirect_uri: 'http://localhost:3000/github'
            })
            });
            const data = await response.json();
            const  {access_token,token_type,scope} = data
            newAccessTocker = access_token


            // // check storage if tocker is exist
            // localStorage.removeItem(user_id);
            // const temp  = {
            //     'user_id' : user_id,
            //     'tocker' : newAccessTocker
            // }
            // localStorage.setItem(user_id,  JSON.stringify(temp));

            // // update user and save tocken
            const filter = { userid: user_id };
            const update = {
            code: git_code,
            accessToken: access_token,
            };
            const options = { new: true };
            const updatedUser = await User.findOneAndUpdate(filter, update, options);
        }
        if(git_code)
        {
            if(newAccessTocker)
            {
                console.log(" access tokern ::::::::;;;; /github1", newAccessTocker)
                // const userRes = await fetch('https://api.github.com/user', {
                // user detail
                let allRepos = [];
                let page = 1;
                const perPage = 100;
                let hasMore = true;
                let userRes;

                while (hasMore) {
                userRes = await fetch(`https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=${perPage}&page=${page}`, {
                method: 'GET',
                headers: {
                'Authorization': `Bearer ${newAccessTocker}`,
                'Accept': 'application/json'
                }
                });

                console.log(" troubleshoot line : ", userRes)
                const repos = await userRes.json();

                if (userRes.status === 401) {
                return res.status(401).json({ message: 'Unauthorized access. Expired access token.', code: 600 });
                }

                if (repos.length === 0) {
                hasMore = false;
                } else {
                allRepos = allRepos.concat(repos);
                page++;
                }
                }
                

                const userData = allRepos;
                console.log("troubleshoot after recursive api call and get result ", userRes)
                if (userRes.status === 401) {
                    console.log("Invalid or expired token. Please re-authenticate.");
                    let message = userRes
                    return res.status(404).json({ message: 'Unauthorized access. Expired access token. re-authenticate again.' ,code:600});
                }
                else
                {
                    // console.log(" ******* everythingi ok :::",userData )
                    const formattedRepos = userData.map(repo => ({
                    name: repo.name,
                    full_name: repo.full_name,
                    owner: {
                    login: repo.owner.login,
                    },
                    default_branch: repo.default_branch,
                    branches_url: repo.branches_url.replace("{/branch}", ""), 
                    }));
                    // res.render('login', { message: formattedRepos });
                    let finalObj
                    const allObj = await processRepositories(formattedRepos, newAccessTocker);
                    console.log(" ****************** allObj ", allObj)
                    console.log(" access_token _______________", newAccessTocker)
                    // res.render('repo', { message: allObj,code: code, temp:access_token });
                    res.status(200).json({ message: allObj,code:200,temp: newAccessTocker }); 
                }
                }
            }
        }
        // START CODE FOR GET ACCESS TOCKEN
        } catch (error) {
            console.error("Error in OdooSh authorization:", error);
            res.status(500).json({ message: error.message , code:500 });
        }
    }

// helper ustil
// fetching all branch name:
async function processRepositories(formattedRepos,access_token) {
    try {
        const allObj = await fetchRepositoriesWithBranches(formattedRepos, access_token);
        
        console.table(allObj); // Log formatted data in a table
        console.log("****************** allObj:", allObj);
        // Now you can use `allObj` for further processing
        return allObj; // Return the latest object if needed elsewhere
    } catch (error) {
        console.error("Error fetching repository branches:", error);
    }
}


async function fetchRepositoriesWithBranches(userData, token) {
    const formattedRepos = await Promise.all(userData.map(async (repo) => {
        const branchesUrl = repo.branches_url.replace("{/branch}", ""); // Remove placeholder

        try {
            const response = await fetch(branchesUrl, {
                headers: {
                    Authorization: `token ${token}`, // Send token in headers
                    Accept: "application/vnd.github.v3+json",
                },
            });
            if (!response.ok) {
                throw new Error(`Error fetching branches for ${repo.name}`);
            }
            const branches = await response.json(); // Get list of branches
            return {
                repo_name       : repo.name,
                full_name       : repo.full_name,
                owner           : repo.owner.login,
                default_branch  : repo.default_branch,
                // "Branches": branches.map(branch => branch.name).join(", "), 
                branches        : branches.map(branch => branch.name),
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }));

    // Filter out null values (failed requests)
    return formattedRepos.filter(repo => repo !== null);
}



// final uplaod moudle
    async function uploadData(req, res) {
    console.log(" req.query in uploadcontroller /uploadcontroller", req.body)
    try {
        const  {owner, repo ,branch ,filepath,module_name,temp, temp1,user_id}  = req.body
        let owner1 = owner || "o2btechnologies"; 
        let repo1 =  repo || "oflowai-test"; 
        let branch1 = branch || "stage"; 
        let localFolderPath = filepath || default_path; 
        let remoteFolderPath = module_name || "o2b_process_modular";
        const code = temp;
        const access_token = temp1;
        let message;
        let status;
        if(!access_token)
        {
            // redirect to again to autherization
            // res.status(400).json({ message: "Something went wrong. please autherize again." });
            let  message = 'Tocken is expired.Please. Got to home page and re-authenticate.'
           
            res.status(500).json({ message: message, code:500 });
        }
        // for user detail url 
        // const userRes = await fetch('https://api.github.com/user', {
        // user detail
        const userRes = await fetch('https://api.github.com/user/repos', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
        }
        });
        if (userRes.status === 401) {
        console.log("Invalid or expired token. Please re-authenticate. /uploadcontroller");
        let message = userRes
        // res.render('error', { message });
        // return null;
        }
        const userData = await userRes.json();
        // console.log("GitHub User Data:", userData);
        // hiting access the git repository:
        try {

        // check storage if tocker is exist
        localStorage.removeItem(user_id);
        const temp  = {
        'user_id'   : user_id,
        'token'     : access_token,
        'owner'     : owner,
        'repo'      : repo1,
        'branch'    : branch1 ,
        }
        localStorage.setItem(user_id,  JSON.stringify(temp));
        console.log("local storage setup")
        // update user and save tocken
         GITHUB_TOKEN = access_token;
         OWNER = owner;
         REPO = repo1;
         BRANCH = branch1;
         FOLDER_PATH = localFolderPath;
         headers =
                {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                };

            // githubApiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;
            MODULE_FOLDER = remoteFolderPath
            githubApiBase = `https://api.github.com/repos/${OWNER}/${REPO}`;
            // const syncRes = await commitAll();
            const syncRes = await commitModule();
            console.log("*** call backup what is reponse ", syncRes)
            if(syncRes === 'ok')
            {

            // save in data for user repo detail while push via checking time

            const filter = { userid: user_id };
            const update = {
            owner : OWNER,
            repo : REPO,
            branch : BRANCH,
            filepath : FOLDER_PATH,
            module_name : MODULE_FOLDER,
            };
            const options = { new: true };
            const updatedUser = await User.findOneAndUpdate(filter, update, options);
            // save in data for user repo detail while push via checking time
            message ="Thanks to be part of OflowAI.com.OflowAI uses latest  Securitization protocol.Base Module uploaded."
            // res.render('dashboard', { message });
            res.status(200).json({ message: message, code:200 });
            }
            else
            {
                message = "Something went wrong.Contact to Administrator."
                res.status(500).json({ message: message, code:500 });
            }
            } catch (error) {
                console.log(" **************** error in upload contrller ", error)
                message = error
                // res.render('error', { message });
                res.status(500).json({ message: message, code:500 });
            }
           
        } catch (error) {
            console.error("Error in GitHub callback:", error);
            res.status(500).json({ message: error, code:500 });
        }
    };

    async function moduleExistsInRepo() {
        try {
            const url = `${githubApiBase}/contents/${MODULE_FOLDER}?ref=${BRANCH}`;
            await axios.get(url, { headers });
            return true;  // Folder exists
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return false;  // Folder does not exist
            }
            throw error;
        }
    }

    // **Step 2: Get Latest Commit SHA**
    async function getLatestCommitSHA() {
        const url = `${githubApiBase}/git/ref/heads/${BRANCH}`;
        const { data } = await axios.get(url, { headers });
        return data.object.sha;
    }

    // **Step 3: Get Tree SHA**
    async function getTreeSHA(commitSHA) {
        const url = `${githubApiBase}/git/commits/${commitSHA}`;
        const { data } = await axios.get(url, { headers });
        return data.tree.sha;
    }

    // **Step 4: Read Folder and Prepare Tree**
    async function createGitTree(folderPath, parentPath = '') {
        let tree = [];
        const files = fs.readdirSync(folderPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(folderPath, file.name);
            const gitPath = path.join(parentPath, file.name).replace(/\\/g, '/');

            if (file.isDirectory()) {
                tree = tree.concat(await createGitTree(fullPath, gitPath)); 
            } else {
                const content = fs.readFileSync(fullPath, 'utf8');
                const blob = await axios.post(`${githubApiBase}/git/blobs`, {
                    content: content,
                    encoding: 'utf-8'
                }, { headers });

                tree.push({
                    path: gitPath,
                    mode: '100644', // Regular file
                    type: 'blob',
                    sha: blob.data.sha
                });
            }
        }
        return tree;
    }

    // **Step 5: Create New Tree**
    async function createTree(baseTreeSHA, tree) {
        const url = `${githubApiBase}/git/trees`;
        const { data } = await axios.post(url, {
            base_tree: baseTreeSHA,
            tree
        }, { headers });
        return data.sha;
    }

    // **Step 6: Create Commit**
    async function createCommit(treeSHA, parentCommitSHA) {
        const url = `${githubApiBase}/git/commits`;
        const { data } = await axios.post(url, {
            message: `Updating Odoo module: ${MODULE_FOLDER}`,
            tree: treeSHA,
            parents: [parentCommitSHA]
        }, { headers });
        return data.sha;
    }

    // **Step 7: Update Branch Reference**
    async function updateBranch(commitSHA) {
        const url = `${githubApiBase}/git/refs/heads/${BRANCH}`;
        await axios.patch(url, { sha: commitSHA }, { headers });
    }

    // **Main Function to Execute All Steps**
    async function commitModule() {
        try{
            console.log(`🔍 Checking if module '${MODULE_FOLDER}' exists in the repo...`);
            const moduleExists = await moduleExistsInRepo();

            console.log('🔄 Fetching latest commit...');
            const latestCommitSHA = await getLatestCommitSHA();
            const baseTreeSHA = await getTreeSHA(latestCommitSHA);

            console.log(`📂 Reading '${MODULE_FOLDER}' folder contents...`);
            const tree = await createGitTree(FOLDER_PATH, MODULE_FOLDER);

            console.log('🌳 Creating new tree...');
            const newTreeSHA = await createTree(baseTreeSHA, tree);

            console.log('📝 Creating new commit...');
            const newCommitSHA = await createCommit(newTreeSHA, latestCommitSHA);

            console.log('🚀 Updating branch reference...');
            await updateBranch(newCommitSHA);
            console.log(`✅ Odoo module '${MODULE_FOLDER}' committed successfully!`);
            return 'ok'
        }
        catch(error)
        {
            console.log(" Error in commit file " , error)
            return error;
        }
    }

    // installation check 
    async function validateInstallation(req, res) {
    try {
        const { user_id,parameter } = req.query; // Use req.query for GET request parameters

        console.log("We are in OdooSh validation", req.body, "params:", req.params, "query:", req.query);

        if (!user_id) {
            return res.status(400).json({ message: 'Unauthorized access. User ID is missing.' });
        }

        const user = await User.findOne({ userid: String(user_id) }); // Correct string conversion

        console.log("User:", user);

        if (!user) { // `findOne` returns null if no user is found
            return res.status(404).json({ message: 'No User ID found for this action.' });
        }


        if (!parameter) { // `findOne` returns null if no user is found
            return res.status(404).json({ message: 'No server Url found to validate module installation.' });
        }

        const end_point = "/install";
        const apiUrl = `${parameter}${end_point}`;
        // console.log("Connection URL: ", apiUrl);

        try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          // throw new Error(`HTTP error! Status: ${response.status}`);
            return res.status(500).json({
          message:
            "Failed to communicate .Pleae wait untill odoo.sh finished build process Or  install Oflow module manually. ",
        });
        }
        const data = await response.json();
        // console.log("Connection successful:", data);
        if (data.code === "404") {
          return res.status(401).json({ message: data.message, code: 404 });
        }

        if (data.code === "201") {
          return res.status(201).json({ message: data.message, code: 201 });
        }


        if (data.code === "500") {
          return res.status(500).json({ message: data.message, code: 500 });
        }

        } catch (error) {
        console.log("Error fetching data:", error);
        return res.status(500).json({
          message:
            "Failed to communicate .Please install Oflow module manually. " + error.message,
        });
        }
    

        res.status(200).json({ message: githubUrl }); // Use 200 for successful responses
    } catch (error) {
        console.error("Error in OdooSh authorization:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
}


// *************api for login with github autherization***********
async function githubLoginRedirect(req, res) {
    const state = "login"
    try {
        // const { user_id } = req.query; // Use req.query for GET request parameters

        // console.log("We are in OdooSh validation", req.body, "params:", req.params, "query:", req.query);

        // if (!user_id) {
        //     return res.status(400).json({ message: 'Unauthorized access. User ID is missing.' });
        // }

        // const user = await User.findOne({ userid: String(user_id) }); // Correct string conversion

        // console.log("User:", user);

        // if (!user) { // `findOne` returns null if no user is found
        //     return res.status(404).json({ message: 'No User ID found for this action.' });
        // }

        // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email`;
        // for gituhub repos read and wirte
        // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=repo`;
        // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email,repo`;
        // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email,repo,admin:repo_hook`;
        // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=read:user,user:email,repo,admin:repo_hook,read:org,write:org`;
        // const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID_SIGNIN)}&scope=user`;
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID_SIGNIN)}&state=${state}&scope=user%20user:email`;
        // const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=user,user:email`;

        res.status(200).json({ message: githubUrl }); // Use 200 for successful responses
    } catch (error) {
        console.error("Error in OdooSh authorization:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
}

async function loginRegCallback(req, res) {
    try {
        const { state ,code} = req.query; 
        console.log("We are in OdooSh loginRes method", req.body, "params:", req.params, "query:", req.query);
        if (!state) {
            return res.status(400).json({ message: 'State  is not Defined. state ID is missing.' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Unauthorized access. Code is missing.' });
        }

        // const user = await User.findOne({ userid: String(user_id) }); 
        // console.log("User:", user);
        
        // if (!user) { // `findOne` returns null if no user is found
        //     return res.status(404).json({ message: 'No User ID found for this action.' });
        // }

        // START CODE FOR GET ACCESS TOCKEN
        const authUrl = 'https://github.com/login/oauth/access_token';
        let newAccessTocker ;
   
            const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Accept'        : 'application/json',
                'Content-Type'  : 'application/json'
            },
            body: JSON.stringify({
                client_id       : CLIENT_ID_SIGNIN,
                client_secret   : CLIENT_SECRET_KEY_LOGIN,
                code: code,
                // redirect_uri: 'http://localhost:3000/github'
            })
            });
            const data = await response.json();
            const  {access_token,token_type,scope} = data
            newAccessTocker = access_token
            console.log(" data; ", data)


            // // check storage if tocker is exist
            // localStorage.removeItem(user_id);
            // const temp  = {
            //     'user_id' : user_id,
            //     'tocker' : newAccessTocker
            // }
            // localStorage.setItem(user_id,  JSON.stringify(temp));

            // // update user and save tocken
            // const filter = { userid: user_id };
            // const update = {
            // code: git_code,
            // accessToken: access_token,
            // };
            // const options = { new: true };
            // const updatedUser = await User.findOneAndUpdate(filter, update, options);
        
        if(code)
        {
            if(newAccessTocker)
            {
                console.log(" access tokern ::::::::;;;; /github1", newAccessTocker)
                // const userRes = await fetch('https://api.github.com/user', {
                // user detail
                const userRes = await fetch('https://api.github.com/user/repos', {
                method: 'GET',
                headers: {
                'Authorization': `Bearer ${newAccessTocker}`,
                'Accept': 'application/json'
                }
                });
                const userData = await userRes.json();
                if (userRes.status === 401) {
                    console.log("Invalid or expired token. Please re-authenticate.");
                    let message = userRes
                    return res.status(404).json({ message: 'Unauthorized access. Expired access token. re-authenticate again.' ,code:600});

                }
                else
                {
                    // console.log(" ******* everythingi ok :::",userData )
                    const formattedRepos = userData.map(repo => ({
                    name: repo.name,
                    full_name: repo.full_name,
                    owner: {
                    login: repo.owner.login,
                    },
                    default_branch: repo.default_branch,
                    branches_url: repo.branches_url.replace("{/branch}", ""), 
                    }));
                    // res.render('login', { message: formattedRepos });
                    let finalObj
                    const allObj = await processRepositories(formattedRepos, newAccessTocker);
                    console.log(" ****************** allObj ", allObj)
                    console.log(" access_token _______________", newAccessTocker)
                    // res.render('repo', { message: allObj,code: code, temp:access_token });
                    res.status(200).json({ message: allObj,code:200,temp: newAccessTocker }); 
                }
                }
        }
        // START CODE FOR GET ACCESS TOCKEN
        } catch (error) {
            console.error("Error in OdooSh authorization:", error);
            res.status(500).json({ message: error.message , code:500 });
        }
    }


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function odooshSubsription(req, res) {
    try {
        const { state ,code} = req.query; 
        console.log("We are in OdooSh loginRes method", req.body, "params:", req.params, "query:", req.query);
        if (!state) {
            return res.status(400).json({ message: 'State  is not Defined. state ID is missing.' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Unauthorized access. Code is missing.' });
        }

        // const user = await User.findOne({ userid: String(user_id) }); 
        // console.log("User:", user);
        
        // if (!user) { // `findOne` returns null if no user is found
        //     return res.status(404).json({ message: 'No User ID found for this action.' });
        // }

        // START CODE FOR GET ACCESS TOCKEN
        const authUrl = 'https://github.com/login/oauth/access_token';
        let newAccessTocker ;
   
            const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Accept'        : 'application/json',
                'Content-Type'  : 'application/json'
            },
            body: JSON.stringify({
                client_id       : CLIENT_ID_SIGNIN,
                client_secret   : CLIENT_SECRET_KEY_LOGIN,
                code: code,
                // redirect_uri: 'http://localhost:3000/github'
            })
            });
            const data = await response.json();
            const  {access_token,token_type,scope} = data
            newAccessTocker = access_token
            console.log(" data; ", data)


            // // check storage if tocker is exist
            // localStorage.removeItem(user_id);
            // const temp  = {
            //     'user_id' : user_id,
            //     'tocker' : newAccessTocker
            // }
            // localStorage.setItem(user_id,  JSON.stringify(temp));

            // // update user and save tocken
            // const filter = { userid: user_id };
            // const update = {
            // code: git_code,
            // accessToken: access_token,
            // };
            // const options = { new: true };
            // const updatedUser = await User.findOneAndUpdate(filter, update, options);
        
        if(code)
        {
            if(newAccessTocker)
            {
                console.log(" access tokern ::::::::;;;; /github1", newAccessTocker)
                // const userRes = await fetch('https://api.github.com/user', {
                // user detail
                const userRes = await fetch('https://api.github.com/user/repos', {
                method: 'GET',
                headers: {
                'Authorization': `Bearer ${newAccessTocker}`,
                'Accept': 'application/json'
                }
                });
                const userData = await userRes.json();
                if (userRes.status === 401) {
                    console.log("Invalid or expired token. Please re-authenticate.");
                    let message = userRes
                    return res.status(404).json({ message: 'Unauthorized access. Expired access token. re-authenticate again.' ,code:600});

                }
                else
                {
                    // console.log(" ******* everythingi ok :::",userData )
                    const formattedRepos = userData.map(repo => ({
                    name: repo.name,
                    full_name: repo.full_name,
                    owner: {
                    login: repo.owner.login,
                    },
                    default_branch: repo.default_branch,
                    branches_url: repo.branches_url.replace("{/branch}", ""), 
                    }));
                    // res.render('login', { message: formattedRepos });
                    let finalObj
                    const allObj = await processRepositories(formattedRepos, newAccessTocker);
                    console.log(" ****************** allObj ", allObj)
                    console.log(" access_token _______________", newAccessTocker)
                    // res.render('repo', { message: allObj,code: code, temp:access_token });
                    res.status(200).json({ message: allObj,code:200,temp: newAccessTocker }); 
                }
                }
        }
        // START CODE FOR GET ACCESS TOCKEN
        } catch (error) {
            console.error("Error in OdooSh authorization:", error);
            res.status(500).json({ message: error.message , code:500 });
        }
    }


module.exports = {
    autherizeOooosh,
    getgitCode,
    uploadData,
    validateInstallation,
    githubLoginRedirect,
    loginRegCallback
};
