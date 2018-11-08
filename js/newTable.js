import {
	clone
} from './newDom.js';
/**
 * v-1.0.0
 * 使用方法
 * 1、表格外层需有两层div，
 * <div class="data-table" id="con-table-change">  id:必需属性，值不必固定，该容器最终会包含所有动态append的元素
 * 	<div class="main-table-wapper"> 表格外层容器，
 *	 <table class="table main-table"> 主表格，所有浮动的元素由此clone
 *	 </table>
 *	</div>
 * </div>
 * 2、在组件内
 * 引入所需公共方法
 * import入此类
 * options选项（container 与 containerId至少传一个）
 * container: 容器dom元素,
 * containerId: 容器dom元素的id,
 * isFixedHead: 是否固定表头,
 * isFixedColumn: 是否固定左边部分列,
 * fixedColNumber: 固定列数,
 * isFixedScrollBar: 是否固定滚动条,
 * verticalScrollEle: 垂直滚动区域dom元素
 * 3、在vue实例的生命周期内调用步骤2引入的方法
 * mounted() { 渲染页面时初始化事件
 *  this.table（定义在data的表格对象） = new FixedTable({
		container: document.getElementById('JS_order_edit'),
		isFixedHead: true,
		isFixedColumn: true,
		fixedColNumber: 4,
		isFixedScrollBar: true
	});
 * },
 * updated() { 当页面数据有变化时绘制元素
 *  this.table.init(true); 更新时必须为true
 * },
 * destroyed() { 组件销毁时注销事件
 *  this.table.destroyEvent();
 * }
 *
 *
 */
export default class FixedTable {
	static defaultOptions = {
		container: null,
		containerId: '',
		isFixedHead: false,
		isFixedColumn: false,
		fixedColNumber: 0,
		isFixedScrollBar: false,
		verticalScrollEle: null
	};
	timerIndex = -1;
	constructor(options = {}) {
		this._options = Object.assign({}, FixedTable.defaultOptions, options);
		const container = this._options.container || document.querySelector('#' + containerId);
		this.container = container;
		if (!(container instanceof HTMLElement)) {
			throw new Error('container must be a HTMLElement instance!');
		}

		this.init();
	}
	init() {
		this.containerWidth = this.container.clientWidth || this.container.offsetWidth;
		this.containerPositionL = this.container.offsetLeft || this.container.getBoundingClientRect().left;
		this.mainTable = this.container.querySelector('table');
		this.mainTableWidth = this.mainTable.offsetWidth;
		this.mainTableClass = this.mainTable.className || this.mainTable.classList;
		this.mainTableHead = this.mainTable.querySelector('thead');
		this.mainTableBody = this.mainTable.querySelector('tbody');
		this.mainTableWapper = this.mainTable.parentNode;

		this.columnsWidth();

		this.container.style.position = 'relative';
		if (this._options.isFixedHead || this._options.isFixedColumn) {
			// this.createFixedHead();
			this.createContainer();
		}
		if (this._options.isFixedHead) {
			this.fixedHeadContainer.style.width = this.containerWidth + 'px';
			this.createMainFixedHead();
		}
		if (this._options.isFixedColumn && this._options.fixedColNumber) {
			if (this.fixedHeadColContainer) {
				this.fixedHeadColContainer.style.width = this.fixedHeadColContainerWidth + 'px';
			}
			if (this.fixedColContainer) {
				this.fixedColContainer.style.width = this.fixedHeadColContainerWidth + 'px';
				this.fixedColContainer.style.visibility = 'visible';
			}
			this.resetFixedColWidth();
			if (this.containerWidth < this.mainTableWidth) {
				this.createFixedColumn();
				this.createFixedColumnHead();
			} else if (this.fixedColContainer) {
				this.fixedColContainer.style.visibility = 'hidden';
			}
		}
		if (this._options.isFixedScrollBar) {
			if (this.containerWidth < this.mainTableWidth) {
				var scrollEle = this._options.verticalScrollEle === null ? document.documentElement : this._options.verticalScrollEle;
				var scrollTop = this._options.verticalScrollEle === null ? document.documentElement.scrollTop || document.body.scrollTop : scrollEle.scrollTop;
				var scrollElClientHeight = this._options.verticalScrollEle === null ? document.documentElement.clientHeight || document.body.clientHeight : scrollEle.clientHeight;
				var clientHeight = scrollElClientHeight - this.container.offsetTop + scrollTop;
				var tableHeight = this.mainTableWapper.offsetHeight;
				var visible = 'hidden';
				if ((tableHeight - 5) > clientHeight) {
					visible = 'visible';
				}
				this.scrollContainer.style.width = this.containerWidth + 'px';
				this.scrollContainer.style.visibility = visible;
				this.createFixedScrollBar();
			} else if (this.scrollContainer) {
				this.scrollContainer.style.visibility = 'hidden';
			}
		}
		this.initEvent();
	}
	createContainer() {
		if (this._options.isFixedHead && !this.fixedHeadContainer) {
			this.fixedHeadContainer = document.createElement('div');
			this.fixedHeadContainer.style = 'position: fixed;top: 0;visibility: hidden;z-index: 1010;overflow: hidden;width: ' + this.containerWidth + 'px;';
			this.container.appendChild(this.fixedHeadContainer);
			// this.createMainFixedHead();
		}
		if (this._options.isFixedColumn && this._options.fixedColNumber && this.containerWidth < this.mainTableWidth) {
			if (!this.fixedHeadColContainer) {
				this.fixedHeadColContainer = document.createElement('div');
				this.fixedHeadColContainer.style = 'position: fixed;top: 0;visibility: hidden;z-index: 1020;overflow: hidden;width: ' + this.fixedHeadColContainerWidth + 'px;';
				this.container.appendChild(this.fixedHeadColContainer);
			}
			if (!this.fixedColContainer) {
				this.fixedColContainer = document.createElement('div');
				this.fixedColContainer.style = 'position: absolute;top: 0;left: 0;background: #fff;overflow: hidden;z-index: 1000;width: ' + this.fixedHeadColContainerWidth + 'px;';
				this.container.appendChild(this.fixedColContainer);
			}
		}
		if (this._options.isFixedScrollBar && this.containerWidth < this.mainTableWidth && !this.scrollContainer) {
			this.scrollContainer = document.createElement('div');
			this.scrollContainer.style = 'position: fixed;bottom: 2px;height: 20px;visibility: hidden;z-index: 1010;padding-bottom: 5px;background: #fff;overflow-x: auto;width: ' + this.containerWidth + 'px;';
			this.container.appendChild(this.scrollContainer);
		}
	}
	createMainFixedHead() {
		//顶部锁定表头
		// this.fixedHeadTable = this.mainTable.cloneNode(true);
		if (this.fixedHeadContainer) {
			var table = this.fixedHeadContainer.querySelector('table');
			if (table) {
				table.remove();
				// this.fixedHeadContainer.removeChild(table);
			}
		}
		this.fixedHeadTable = clone(this.mainTable, true);
		let fixedTableBody = this.fixedHeadTable.querySelector('tbody');
		if (fixedTableBody) {
			fixedTableBody.remove();
			// this.fixedHeadTable.removeChild(fixedTableBody);
		}
		this.fixedHeadContainer.appendChild(this.fixedHeadTable);

	}
	createFixedColumnHead() {
		//顶部固定列表头
		// this.fixedColumnHeadTable = this.mainTable.cloneNode(true);
		if (this.fixedColumnHeadTable) {
			var table = this.fixedHeadColContainer.querySelector('table');
			if (table) {
				table.remove();
				// this.fixedHeadColContainer.removeChild(table);
			}
		}
		this.fixedColumnHeadTable = clone(this.mainTable, true);
		let fixedTableBody = this.fixedColumnHeadTable.querySelector('tbody');
		if (fixedTableBody) {
			fixedTableBody.remove();
			// this.fixedColumnHeadTable.removeChild(fixedTableBody);
		}
		this.fixedHeadColContainer.appendChild(this.fixedColumnHeadTable);
	}

	createFixedColumn() {
		if (this.fixedColContainer) {
			var table = this.fixedColContainer.querySelector('table');
			if (table) {
				table.remove();
				// this.fixedColContainer.removeChild(table);
			}
		}
		this.fixedColumnTable = clone(this.mainTable, true);
		this.fixedColContainer.appendChild(this.fixedColumnTable);
		// console.log('createFixedColumn');
	}

	resetFixedColWidth() {
		if (this.fixedColumnTable) {
			var fixedColumnHeadThs = this.fixedColumnTable.querySelector('tr').children;
			for (let i = 0; i < this._options.fixedColNumber; i++) {
				fixedColumnHeadThs[i].style.width = this.columsWidth[i] + 'px';
			}
		}
		if (this.fixedColumnHeadTable) {
			var fixedTableHeadThs = this.fixedColumnHeadTable.querySelector('tr').children;
			for (let i = 0; i < this._options.fixedColNumber; i++) {
				fixedTableHeadThs[i].style.width = this.columsWidth[i] + 'px';
			}
		}
	}

	createFixedScrollBar() {
		if (!this.scrollContainer.querySelector('div')) {
			this.scrollContent = document.createElement('div');
			this.scrollContainer.appendChild(this.scrollContent);
		}
		this.scrollContent.style = 'height: 3px;width:' + this.mainTableWidth + 'px;';
	}
	columnsWidth() {
		//计算固定列的宽度
		this.columsWidth = [];
		this.fixedHeadColContainerWidth = 0;
		var ths = this.mainTableHead.getElementsByTagName('th');
		if (ths) {
			for (var i = 0; i < ths.length; i++) {
				this.columsWidth.push(ths[i].offsetWidth);
				if (this._options.fixedColNumber > i) {
					this.fixedHeadColContainerWidth += this.columsWidth[i];
				}
			}
		}
		this.fixedHeadColContainerWidth += 1; //一像素边框
	}

	initEvent() {
		var scrollEle = this._options.verticalScrollEle === null ? window : this._options.verticalScrollEle;
		if (document.addEventListener) {
			if (this._options.isFixedHead || this._options.isFixedColumn) {
				scrollEle.addEventListener('scroll', this.scrollVertical.bind(this), false);
			}
			if (!this.isAddScroll && this.scrollContainer) {
				this.scrollContainer.addEventListener('scroll', this.scrollHorizontal.bind(this), false);
				this.isAddScroll = true;
			}
			this.mainTableWapper.addEventListener('scroll', this.tableScrollHori.bind(this), false);
		} else {
			if (this._options.isFixedHead || this._options.isFixedColumn) {
				scrollEle.attachEvent('onscroll', this.scrollVertical.bind(this));
			}
			if (this.scrollContainer) {
				this.scrollContainer.attachEvent('onscroll', this.scrollHorizontal.bind(this));
			}
			this.mainTableWapper.attachEvent('onscroll', this.tableScrollHori.bind(this));
		}
	}

	scrollVertical() {
		//垂直方向滚动事件，控制head是否显示
		var scrollEle = this._options.verticalScrollEle === null ? document.documentElement : this._options.verticalScrollEle;
		var scrollTop = this._options.verticalScrollEle === null ? document.documentElement.scrollTop || document.body.scrollTop : scrollEle.scrollTop;
		if ((scrollTop - this.container.offsetTop) >= 0) {
			if (this.fixedHeadContainer) {
				this.fixedHeadContainer.style.visibility = 'visible';
			}
			if (this.containerWidth <= this.mainTableWidth) {
				if (this.fixedHeadColContainer) {
					this.fixedHeadColContainer.style.visibility = 'visible';
				}
			}
		} else {
			if (this.fixedHeadContainer) {
				this.fixedHeadContainer.style.visibility = 'hidden';
			}
			if (this.fixedHeadColContainer) {
				this.fixedHeadColContainer.style.visibility = 'hidden';
			}
		}
		if (this._options.isFixedScrollBar && this.scrollContainer) {
			var scrollElClientHeight = this._options.verticalScrollEle === null ? document.documentElement.clientHeight || document.body.clientHeight : scrollEle.clientHeight;
			var clientHeight = scrollElClientHeight - this.container.offsetTop + scrollTop;
			var tableHeight = this.mainTableWapper.offsetHeight;
			if ((tableHeight - 5) > clientHeight) {
				if (this.scrollContainer) {
					this.scrollContainer.style.visibility = 'visible';
				}
			} else {
				if (this.scrollContainer) {
					this.scrollContainer.style.visibility = 'hidden';
				}
			}
		}
	}

	scrollHorizontal() {
		var $this = this;
		this.timerIndex = setTimeout(function() {
			$this.mainTableWapper.scrollLeft = $this.scrollContainer.scrollLeft;
			if ($this.fixedHeadContainer) {
				$this.fixedHeadContainer.scrollLeft = $this.scrollContainer.scrollLeft;
			}
		}, 0);
	}

	tableScrollHori() {
		clearTimeout(this.timerIndex);
		if (this.scrollContainer) {
			this.scrollContainer.scrollLeft = this.mainTableWapper.scrollLeft;
		}
		if (this.fixedHeadContainer) {
			this.fixedHeadContainer.scrollLeft = this.mainTableWapper.scrollLeft;
		}
	}

	destroyEvent() {
		var scrollEle = this._options.verticalScrollEle === null ? window : this._options.verticalScrollEle;
		if (document.removeEventListener) {
			if (this._options.isFixedHead || this._options.isFixedColumn) {
				scrollEle.removeEventListener('scroll', this.scrollVertical.bind(this), false);
			}
			if (this.scrollContainer) {
				this.scrollContainer.removeEventListener('scroll', this.scrollHorizontal.bind(this), false);
			}
			this.mainTableWapper.removeEventListener('scroll', this.tableScrollHori.bind(this), false);
		} else {
			if (this._options.isFixedHead || this._options.isFixedColumn) {
				scrollEle.detachEvent('onscroll', this.scrollVertical.bind(this));
			}
			if (this.scrollContainer) {
				this.scrollContainer.detachEvent('onscroll', this.scrollHorizontal.bind(this));
			}
			this.mainTableWapper.detachEvent('onscroll', this.tableScrollHori.bind(this));
		}
	}
}