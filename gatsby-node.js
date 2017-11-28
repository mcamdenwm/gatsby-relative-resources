const fs = require('fs');
const readdir = require('recursive-readdir');

const bootstrap = `
<script>
(function bootstrap() {
  var path = location.pathname;
  var pwaPath = path.split('/')[1];
  var head = document.querySelector('head');

  // Unable to use tree manipulation because reasons
  head.innerHTML = '<base href="/'+pwaPath+'/" />' + head.innerHTML;
})();
function writeLink(link) {
  var head = document.querySelector('head');
  head.innerHTML += link;
}
</script>
`;

exports.onPostBuild = () => {
  return new Promise((resolve, reject) => {
    readdir('./public').then((files) => {
      files.forEach((file) => {
        fs.readFile(file, 'utf8', (err, data) => {
          if (err) {
            return reject(err);
          }

          let replacedContent = data.replace(/\/##WM_REPLACE_PATH_PREFIX##/g, '.');
          if (file.indexOf('.html') !== -1) {
            replacedContent = replacedContent.replace('<head>', '<head>' + bootstrap);
            replacedContent = replacedContent.replace(/<link rel="preload"(.*)?\/>/ig, '<script>writeLink(`<link rel="preload"$1`)</script>');
          }

          fs.writeFile(file, replacedContent, (errr) => {
            if (errr) {
              return reject(errr);
            }

            resolve();
          });
        });
      });
    });
  });
};
