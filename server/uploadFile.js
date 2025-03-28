var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');

http.createServer(function (req, res) {
    if(req.url == '/fileupload' && req.method.toLowerCase() === 'post') {
        var form = new formidable.IncomingForm();
        form.uploadDir = 'C:/Users/HP/Desktop/chess2.com/uploads';
        form.keepExtensions = true;

        form.parse(req, function (err,fields,files) {
            if(err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.write('File upload failed');
                res.end();
                return;
            }

            if (!files.filetoupload) {
                res.writeHead(400, {'Content-Type': 'text/plain'});
                res.write('No file uploaded');
                res.end();
                return;
            }

            var oldpath = files.filetoupload.filepath;
            var newpath = path.join(form.uploadDir, files.filetoupload.originalFilename);
            console.log(newpath);

            fs.rename(oldpath, newpath, function (err) {
                if(err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.write('File upload failed');
                    res.end();
                    return;
                }

                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.write('File uploaded and moved!');
                res.end();
            });
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
        res.write('<input type="file" name="filetoupload"><br>');
        res.write('<input type="submit">');
        res.write('</form>');
        return res.end();
    }
}).listen(8080, () => {
    console.log('Server started on http://localhost:8080');
});