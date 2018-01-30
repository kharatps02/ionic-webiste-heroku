// Corodova hook for copying the appropriate config files based on environment.
'use strict';
(function(){
    var fs = require('fs');
    var path = require('path');
    var appDir = path.dirname(require.main.filename);
    var env = process.env.BUILD_ENV || 'dev';
    var FileCopy = {};
 
    FileCopy.utility =  {
        isFileExists : function(filePath){
            try  {
                return fs.statSync(filePath).isFile();
            }
            catch (e) {
                console.log(appDir+filePath + " Does not exist");
                return false;
            }
        },
        isDirectoryExists : function(dirPath){
            try  {
                return fs.statSync(dirPath).isDirectory();
            }
            catch (e) {
                console.log(dirPath + " Does not exist");
                return false;
            }
        }
    };
 
 
    function prepareAppConfig(){
        console.log("Setting Environment to " + env);
        let configToCopy = 'config/environment.'+env+'.ts';

        if (FileCopy.utility.isFileExists(configToCopy) && FileCopy.utility.isDirectoryExists('src/shared')) {
            let contents;
            try {
                contents = fs.readFileSync(configToCopy).toString();
                fs.writeFileSync('src/shared/environment.ts', contents);
            } catch(err) {
                console.log(err);
                process.stdout.write(err);
            }
        }
    }
   
    prepareAppConfig();
}());