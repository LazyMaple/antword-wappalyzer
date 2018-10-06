/**
 * 核心扫描模块
 */
const fs = require('fs');
const https = require('https');
const path = require('path');
const url = require('url');
const wappalyzer = require('./wappalyzer');
class Scanner {
  constructor(opt, argv) {
    this.cookies = []
    this.headers = []
    this.html = ''
    this.scripts = []
    try {
      fs.accessSync(path.join(__dirname, 'apps.json'), (fs.constants || fs).R_OK)
    } catch (error) {
      const bufs = [];
      const options = {
        hostname: 'raw.githubusercontent.com',
        port: 443,
        path: '/AliasIO/Wappalyzer/master/src/apps.json',
        method: 'GET'
      };
      const req = https.request(options, (res) => {
        res.on('data', (d) => {
          console.log('app.json downloading')
          bufs.push(d)
        })
        res.on('end', () => {
          const buf = Buffer.concat(bufs);
          if (buf.length) {
            fs.writeFileSync(__dirname + '/apps.json', buf);
            console.log('app.json downloaded!')
          }
        })
      });
      req.on('error', (e) => {
        console.error(e);
      });
      req.end();
    }
    return new Promise((resolve, reject) => {
      const {
        BrowserWindow
      } = antSword.remote
      let win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false
      })
      win.loadURL('http://www.baidu.com/')
      const webContents = win.webContents;
      webContents.on('did-finish-load', (event) => {
        // 页面加载完成
        console.log('event load finished')
        webContents.session.cookies.get({}, (error, cookies) => {
          this.cookies = this.getCookies(cookies);
          webContents.executeJavaScript(`
            ({scripts:Array.prototype.slice.apply(document.scripts).filter(script => script.src).map(script => script.src),
            html: document.getElementsByTagName('html')[0].innerHTML
            });
            `, true, (res) => {
            this.html = res.html;
            this.scripts = res.scripts
            // console.log(Object.keys(this.headers))
            this.wappalyzer = new wappalyzer();
            const json = JSON.parse(fs.readFileSync(path.resolve(__dirname + '/apps.json')));
            this.wappalyzer.apps = json.apps;
            this.wappalyzer.categories = json.categories;
            this.wappalyzer.parseJsPatterns();
            this.wappalyzer.driver.log = (message, source, type) => console.log(message, source);
            this.wappalyzer.analyze(url.parse('https://github.com'), {
              cookies: this.cookies,
              html: this.html,
              scripts: this.scripts,
              headers: this.headers
            }).then(() => {
              win.close()
              resolve(this.wappalyzer)
            })
          })
        })

      })
      webContents.on('did-fail-load', (event, errorCode, errorDescription, validateURL) => {
        // 加载失败
        console.log(event, errorCode, errorDescription, validateURL)
        win.close()
      })
      webContents.once('did-get-response-details', (...args) => {
        this.headers = args[7];
      })
    })
  }

  /**
   * 
   */
  wappalyzerScanner() {
    const json = JSON.parse(fs.readFileSync(path.resolve(__dirname + '/apps.json')));
    this.wappalyzer.apps = json.apps;
    this.wappalyzer.categories = json.categories;
    this.wappalyzer.parseJsPatterns();
    this.wappalyzer.driver.log = (message, source, type) => console.log(message, source);
    this.wappalyzer.driver.displayApps = (detected, meta, context) => console.log(detected, meta, context);

  }

  /**
   * 扫描代码函数
   * @return {[type]}      [description]
   */
  getCookies(cookiesArray) {
    const cookies = [];
    cookiesArray.forEach(cookie => cookies.push({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path
    }));
    return cookies
  }
}

module.exports = Scanner;