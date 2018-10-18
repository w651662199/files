const fs = require('fs');
const path = require('path');
var request = require('request');
const util = require('util');
const querystring = require('querystring');

const HOST = 'http://10.112.178.90:5000/';
const deployFilePath = 'dist/static';

// const FILES = [];

// var dFiles = getDeployFiles(deployFilePath);
main();

function getDeployFiles(filePath) {
	let deployFiles = [];

	for (let fileDir of fs.readdirSync(filePath)) {
		let dirPath = path.join(filePath, fileDir);
		for (let file of fs.readdirSync(dirPath)) {
			let fp = path.join(dirPath, file);
			let fileExt = path.extname(fp);
			let fileFullName = path.basename(fp, fileExt) + fileExt;
			let fileName = path.basename(fp, fileExt).split('.')[0] + fileExt;
			let fileStat = fs.statSync(fp);
			let fCTime_1 = fileStat.birthtime;
			let uploadPath = deployFilePath + '/' + fileExt.replace('.', '');
			if (deployFiles[fileName]) {
				let fCTime_2 = deployFiles[fileName].birthtime;
				if ((fCTime_1 - fCTime_2) > 0) {
					deployFiles[fileName] = {name: fileFullName, path: fp, birthtime: fCTime_1, uploadPath: uploadPath.replace('/' + '_')};
				}
			} else {
				deployFiles[fileName] = {name: fileFullName, path: fp, birthtime: fCTime_1, uploadPath: uploadPath.replace('/' + '_')};
			}
		}
	}
	return deployFiles;
}

function getProjectName() {
	let name = '', packageJson;
	let jsonFile = fs.readFileSync('package.json', {encoding: 'utf8', flag: 'r'});
	if (jsonFile) {
		packageJson = JSON.parse(jsonFile);
		name = packageJson.name;
	}
	return name.toUpperCase();
}

function deployFile(projectName, file) {
	var formData = {
		file: fs.createReadStream(file.path),
		project: projectName,
		path: file.uploadPath
	}
	request.post({
		url: 'http://10.112.178.90:5000/api/deploy',
		formData: formData
	}, (err, res, body) => {
		if (!err && res.statusCode == 200) {
			console.log('upload ' + file.path);
    	} else {
    		console.log(err);
    	}
	});
}

function main() {
	var project = getProjectName();
	if (!project) return;
	var deployFiles = getDeployFiles(deployFilePath);
	for (var file in deployFiles) {
		deployFile(project, deployFiles[file]);
	}
}