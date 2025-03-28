// exports.myDateTime = function () {
//     return Date();
// }

var http = require('http');
var url = require('url');
// var dt = require('./data');

var fs = require('fs');
var path = require('path');

var formidable = require('formidable');
var path = require('path');

http.createServer(function (req, res) {
    if (req.url == '/fileupload') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldpath = files.filetoupload.filepath;
            var newpath = 'C:/Users/HP/Desktop/chess2.com/uploads' + files.filetoupload.originalFilename;
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                res.write('File uploaded and moved!');
                res.end();
            });
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
        res.write('<input type="file" name="filetoupload"><br>');
        res.write('<input type="submit">');
        res.write('</form>');
        return res.end();
    }
}).listen(8080);






// http.createServer(function (req,res) {
//     // res.writeHead(200, {'Content-Type': 'text/html'});
//     // res.end(dt.myDateTime());
//     // res.write(req.url);
//     // var q = url.parse(req.url, true).query;
//     // var text = q.year + " " + q.month;
//     // res.end(text);

//     fs.readFile('temp.html', function(err,data) {
//         res.writeHead(200, {'Content-Type': 'text/html'});
//         res.write(data);
//         return res.end();
//     })
// }).listen(8080);

// fs.appendFile('mynewfile.txt', 'hello conetn', function(err) {
//     if (err) throw err;
//     console.log('Saved!');
// })

// fs.open('mynewfile2.txt', 'w', function(err, file) {
//     if (err) throw err;
//     console.log('Saved!');
// });

// fs.writeFile('mynewfile3.txt', 'hello content', function(err) {
//     if (err) throw err;
//     console.log('Saved!');
// });

// fs.appendFile('mynewfile3.txt', 'This is my text.', function(err) {
//     if (err) throw err;
//     console.log('Updated!');
// });

// fs.writeFile('mynewfile3.txt', 'This is my text', function (err) {
//     if (err) throw err;
//     console.log('Replaced!');
//   });

// fs.unlink('mynewfile3.txt', function (err) {
//     if (err) throw err;
//     console.log('File deleted!');
// });

// fs.rename('mynewfile.txt', 'myrenamedfile.txt', function(err) {
//     if (err) throw err;
//     console.log('File Renamed!');
// });

// console.log(dt.myDateTime());