/**
 * 插件UI框架
 */

const WIN = require('ui/window');
const LANG = require('../language/');

class UI {
  constructor(opt) {
    // 创建一个windows窗口
    this.win = new WIN({
      title: `${LANG['title']} - ${opt['url']}`,
      // 作为一名代码洁癖患者，我连尺寸的Number都要求有意义，嗯。
      height: 444,
      width: 700,
    });
    this.createMainLayout();
    return {
      onScan: (func) => {
        this.bindToolbarClickHandler(func);
      },
      onAbout: () => {}
    }
  }

  /**
   * 创建上下layout:扫描输入&&扫描结果
   * @return {[type]} [description]
   */
  createMainLayout() {
    let layout = this.win.win.attachLayout('2E');
    // 扫描输入
    layout.cells('a').hideHeader();
    layout.cells('a').setHeight(32)
    layout.cells('a').setText(`<i class="fa fa-cogs"></i> ${LANG['cella']['title']}`);
    // 扫描结果
    layout.cells('b').setText(`<i class="fa fa-bars"></i> ${LANG['cellb']['title']}`);

    // 创建toolbar
    this.createToolbar(layout.cells('a'));
    // 创建grid
    this.createGrid(layout.cells('b'));

    this.layout = layout;
  }

  /**
   * 创建扫描输入工具栏
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createToolbar(cell) {
    let toolbar = cell.attachToolbar();
    toolbar.loadStruct([{
      id: 'start',
      type: 'button',
      text: LANG['cella']['start'],
      icon: 'play'
    }]);
    this.toolbar = toolbar;
  }

  /**
   * 创建扫描输入表单
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createForm(cell) {
    let formdata = [{
      type: 'settings',
      position: 'label-left',
      labelWidth: 150,
      inputWidth: 200
    }];
    let form = cell.attachForm(formdata, true);
    form.enableLiveValidation(true);
    this.form = form;
  }

  /**
   * 创建扫描结果表格
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createGrid(cell) {
    let grid = cell.attachGrid();
    grid.setHeader(`
      ${LANG['cellb']['grid']['name']},
      ${LANG['cellb']['grid']['fingerprint']},
      ${LANG['cellb']['grid']['category']},
      ${LANG['cellb']['grid']['version']},
      ${LANG['cellb']['grid']['confidenceTotal']}
    `);
    grid.setColTypes("ro,ro,ro,ro,ro");
    grid.setColSorting('str,str,str,str,str');
    grid.setInitWidths("110,*,150,60,80");
    grid.setColAlign("left,left,left,left,center");
    grid.enableMultiselect(true);
    grid.init();

    this.grid = grid;
  }

  /**
   * 监听开始按钮点击事件
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  bindToolbarClickHandler(callback) {
    this.toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'start':
          // 开始扫描
          // 加载中
          this.win.win.progressOn();
          // 传递给扫描核心代码
          callback({}).then((ret) => {
              console.log(ret)
              let griddata = [];
              let index = 0;
              for (let item in ret.apps) {
                griddata.push({
                  id: index,
                  data: [item, JSON.stringify(ret.apps[item].confidence), ret.categories[ret.apps[item].props.cats[0]].name, ret.apps[item].version || 'None', ret.apps[item].confidenceTotal]
                })
                index++;
              }
              // 渲染UI
              this.grid.clearAll();
              this.grid.parse({
                rows: griddata
              }, "json");
              toastr.success(LANG['success'], antSword['language']['toastr']['success']);
              // 取消锁定LOADING
              this.win.win.progressOff();
            })
            .catch((err) => {
              console.error(err)
              toastr.error(LANG['error'], antSword['language']['toastr']['error']);
              this.win.win.progressOff();
            });
          break;
        default:

      }
    })
  }
}

module.exports = UI;