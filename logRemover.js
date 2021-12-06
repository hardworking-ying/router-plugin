const fs = require("fs");
module.exports = class RemoveLogs {
  apply(compiler) {
    compiler.hooks.done.tap("RemoveLogs", stats => {
      const { path, filename } = stats.compilation.options.output;
      console.log('------------------------path', path, 'fielname', filename);
      try {
        let filePath = path + "/" + filename;
        fs.readFile(filePath, "utf8", (err, data) => {
          const rgx = /console.log\(['|"](.*?)['|"]\)/;
          const newdata = data.replace(rgx, "");
          if (err) console.log(err);
          fs.writeFile(filePath, newdata, function(err) {
            if (err) {
              return console.log(err)
            }
            console.log("Logs Removed");
          });
        });
      } catch (error) {
        console.log(error)
      }
    });
  }
};