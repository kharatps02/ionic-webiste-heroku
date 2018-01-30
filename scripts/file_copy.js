// A Simple File copy utility. Use the FileCopy constructor function to create an instance and supply
// an array of file object. The file object must have filePath, type and copyLocation properties.
// Example file Object : {filePath : 'release/release-signing.properties', type : 'Binary', copyLocation : 'platforms/android'}
'use strict';
var mkdirp = require('mkdirp');
var FileCopy = (function () {
    var fs = require('fs');
    var path = require('path');

    var appDir = path.dirname(require.main.filename);

    function FileCopy(files) {
        this.files = files;
    }

    FileCopy.prototype.startCopying = function () {
        if (this.files && this.files.length > 1) {
            for (let i = 0; i < this.files.length; i++) {
                start(this.files[i].filePath, this.files[i].copyLocation, this.files[i].type);
            }
        } else {
            console.log("No Files to copy");
        }
    }

    FileCopy.utility = {
        isFileExists: function (filePath) {
            try {
                return fs.statSync(filePath).isFile();
            }
            catch (e) {
                console.log(appDir + "/" + filePath + " Does not exist");
                return false;
            }
        },
        isDirectoryExists: function (dirPath) {
            try {
                if (!fs.existsSync(dirPath)) {
                    console.log("does not exist");
                    mkdirp.sync(dirPath, {})
                    return true;
                }
                else {
                    return true;
                }

            }
            catch (e) {
                console.log(e + " " + dirPath + " Does not exist");
                return false;
            }
        }
    };


    function start(filePath, copyLocation, fileType) {
        if (FileCopy.utility.isFileExists(filePath) && FileCopy.utility.isDirectoryExists(copyLocation)) {
            let contents;
            try {
                if (fileType === 'Text') {
                    contents = fs.readFileSync(filePath).toString();
                } else {
                    console.log(contents);
                    contents = fs.readFileSync(filePath);
                }

                let filePathArr = filePath.split('/');
                let fileName = filePathArr[filePathArr.length - 1];
                fs.writeFileSync(copyLocation + '/' + fileName, contents);
                console.log("File Copied - ", fileName);
            } catch (err) {
                console.log("Error ", err);
                process.stdout.write(err);
            }
        }
    }
    return FileCopy;
}());


var files = [{ filePath: 'release/release-signing.properties', type: 'Text', copyLocation: 'platforms/android' },
{ filePath: 'release/rezility.keystore', type: 'Binary', copyLocation: 'platforms/android' },
{ filePath: 'src/assets/img/ic_noti.png', type: 'Binary', copyLocation: 'platforms/android/res/drawable' },
{ filePath: 'config/PluginGeocoder.java', type: 'Text', copyLocation: 'platforms/android/src/plugin/google/maps' },
{ filePath: 'config/CDVTTS.m', type: 'Text', copyLocation: 'platforms/ios/rezility/Plugins/cordova-plugin-tts' },
{ filePath: 'config/DatePicker.m', type: 'Text', copyLocation: 'platforms/ios/rezility/Plugins/cordova-plugin-datepicker' }]


var copyTool = new FileCopy(files);
copyTool.startCopying();