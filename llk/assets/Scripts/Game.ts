import { InitChessBoard } from './InitChessBoard';
import { chessBoardMsg } from './Utils';


const {ccclass, property} = cc._decorator;

@ccclass
export class Game extends cc.Component {



    @property(InitChessBoard)
	initChessBoard: InitChessBoard = null;
	
 	@property(cc.Prefab)
	h_linePrefab: cc.Prefab = null;

	@property(cc.Prefab)
	s_linePrefab: cc.Prefab = null;

	@property(cc.Prefab)
	round_Prefab: cc.Prefab = null;


	
	temp_lines:any = []
    temp_Node :any = null //存储第一次点击的棋子
    _lastClickX = -1      
    _lastClickY = -1
    _TYPE_INIT = -1  // 图片状态： 初始化
	_TYPE_DELED= -2  // 图片状态： 消除
	pic_size = 90
	out_line_size = 10

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        for (let row = 0; row < chessBoardMsg.row; row++) {
			for (let column = 0; column < chessBoardMsg.column ; column++) {
                let chess =  this.initChessBoard.chessNdArr[row][column]
                chess.on(cc.Node.EventType.TOUCH_START, ()=>{
                    // console.log("chess",chess.getComponent('Chess'));
                    //是否有棋子
                    if (chess.getComponent(cc.Sprite).spriteFrame) {
                        let chess_pointX = chess.getComponent('Chess').pointX
                        let chess_pointY = chess.getComponent('Chess').pointY
                        //第一次点击
                        if (this._lastClickX == -1 || this._lastClickY == -1) {
                            this.temp_Node = chess;
							chess.scale = 1.2;
							this._lastClickX = chess.getComponent('Chess').pointX;
							this._lastClickY = chess.getComponent('Chess').pointY;
                        }else if (this._lastClickX == chess_pointX && this._lastClickY == chess_pointY) {
                            console.log("点击同一位子");
                            chess.scale = 1;
							this.temp_Node = chess;
							this._lastClickX = -1;
							this._lastClickY = -1;
                        }else if (this.temp_Node.getComponent('Chess').type == chess.getComponent('Chess').type) {
                            console.log("图片相同判断");
                            chess.scale = 1.2;
                            this.chessTheSameJudge(chess)
                        }else{
                                console.log("点击的不是同一位子");
                                chess.scale = 1.2;
                                this.temp_Node.scale = 1;
                                this.temp_Node = chess;
                                this._lastClickX = chess.getComponent('Chess').pointX;
                                this._lastClickY = chess.getComponent('Chess').pointY;
                        }
                    }
                })
            }
        }
    }


    chessTheSameJudge(chess){
        if (this.isLinked(this._lastClickX, this._lastClickY, chess.getComponent('Chess').pointX, chess.getComponent('Chess').pointY)) {
            console.log("可连接");
            this.onLine(this._lastClickX, this._lastClickY, chess.getComponent('Chess').pointX, chess.getComponent('Chess').pointY)
            this.clearLinked(this._lastClickX, this._lastClickY, chess.getComponent('Chess').pointX, chess.getComponent('Chess').pointY);
            this._lastClickX = -1;
            this._lastClickY = -1;
        } else {
            console.log("不可连接");
            this.temp_Node.scale = 1;
            this.temp_Node = chess;
            this._lastClickX = chess.getComponent('Chess').pointX;
            this._lastClickY = chess.getComponent('Chess').pointY;
            //cc.audioEngine.playEffect(this.ErrorAudio, false);
            // createjs.Sound.play("click")
        }
    }


    isLinked(x1, y1, x2, y2){
		let tmpXY = [];
		// let tmpAbsXY = [];
		if (this.matchBlockLine(x1, y1, x2, y2)) {
			return true;
		} else {
			tmpXY = this.matchBlockCorner(x1, y1, x2, y2, null)
			if (tmpXY) {
				return true;
			} else {
				tmpXY = this.matchBlockUnfold(x1, y1, x2, y2);
				if (tmpXY) {
					return true;
				}
			}
		}
		return false;
    }

    /**
	 * 直连
	 */
	matchBlockLine(x1, y1, x2, y2){
		// cc.warn('matchBlock  ' + x1 + ', ' + y1 + '  : ' + x2 + ', ' + y2);
		if (x1 != x2 && y1 != y2) {
			return false;
		}
		if (x1 == x2) {
			// 同一列
			if (x1 < 0 || x1 >= chessBoardMsg.row) {
				return true;
			}
			let Ymin = Math.min(y1, y2) + 1;
			let Ymax = Math.max(y1, y2);
			for (Ymin; Ymin < Ymax; Ymin++) {
				if (this.initChessBoard._canvasGrids[x1 + 1][Ymin + 1] > this._TYPE_INIT) {
					return false;
				}
			}
		} else if (y1 == y2) {
			// 同一行
			if (y1 < 0 || y1 >= chessBoardMsg.column) {
				return true;
			}
			let Xmin = Math.min(x1, x2) + 1;
			let Xmax = Math.max(x1, x2);
			for (Xmin; Xmin < Xmax; Xmin++) {
				if (this.initChessBoard._canvasGrids[Xmin + 1][y1 + 1] > this._TYPE_INIT) {
					return false;
				}
			}
		}
		return true;
    }
    

    // /**
	//  * 转角逻辑
	//  */
	matchBlockCorner_point(x1, y1, x2, y2, x3, y3) {
		let stMatch = this.matchBlockLine(x1, y1, x3, y3);
		if (stMatch) {
			let tdMatch = this.matchBlockLine(x3, y3, x2, y2);
			if (tdMatch) {
				return [x3, y3];
			}
		}
		return null;
    }
    	/**
	 * 一个转角
	 * 搜索到路径时，返回转角坐标 x3, y3
	 */
	matchBlockCorner(x1, y1, x2, y2, isAxis_X) {
		// cc.warn('matchBlockCorner  ' + x1 + ', ' + y1 + '  : ' + x2 + ', ' + y2);
		let result;
		// 直连的返回
		if (x1 == x2 || y1 == y2) {
			return null;
		}
		// 转角点1 (x1, y2)，Y方向
		if (this.initChessBoard._canvasGrids[x1 + 1][y2 + 1] <= this._TYPE_INIT && isAxis_X != false) {
			result = this.matchBlockCorner_point(x1, y1, x2, y2, x1, y2);
			if (result) {
				return result;
			}
		}
		// 转角点2 (x2, y1)，X方向
		if (this.initChessBoard._canvasGrids[x2 + 1][y1 + 1] <= this._TYPE_INIT && isAxis_X != true) {
			result = this.matchBlockCorner_point(x1, y1, x2, y2, x2, y1);
			if (result) {
				return result;
			}
		}
		return null;
    }
    

	/**
	 * 由中心往外展开搜索路径，某个方向当碰到有图片时，这个方向就不再继续搜索
	 * 搜索到路径时，返回两个转角点坐标 x3, y3, x4, y4
	 */
	matchBlockUnfold(x1, y1, x2, y2) {
		let result;
		let x3 = 0;
		let y3 = 0;
		let canUp = true;
		let canDown = true;
		let canLeft = true;
		let canRight = true;

		// cc.warn('matchBlockUnfold  ' + x1 + ', ' + y1 + '  : ' + x2 + ', ' + y2);
		for (let i = 1; i < chessBoardMsg.row; i++) {
			// 上
			x3 = x1;
			y3 = y1 + i;
			if (canUp && y3 <= chessBoardMsg.column) {
				canUp = this.initChessBoard._canvasGrids[x3 + 1][y3 + 1] <= this._TYPE_INIT;
				result = this.matchBlockUnfold_axis(x1, y1, x2, y2, x3, y3, false);
				if (result) {
					return result;
				}
			}

			// 下
			x3 = x1;
			y3 = y1 - i;
			if (canDown && y3 >= -1) {
				canDown = this.initChessBoard._canvasGrids[x3 + 1][y3 + 1] <= this._TYPE_INIT;
				result = this.matchBlockUnfold_axis(x1, y1, x2, y2, x3, y3, false);
				if (result) {
					return result;
				}
			}

			// 左
			x3 = x1 - i;
			y3 = y1;
			if (canLeft && x3 >= -1) {
				canLeft = this.initChessBoard._canvasGrids[x3 + 1][y3 + 1] <= this._TYPE_INIT;
				result = this.matchBlockUnfold_axis(x1, y1, x2, y2, x3, y3, true);
				if (result) {
					return result;
				}
			}

			// 右
			x3 = x1 + i;
			y3 = y1;
			if (canRight && x3 <= chessBoardMsg.row) {
				canRight = this.initChessBoard._canvasGrids[x3 + 1][y3 + 1] <= this._TYPE_INIT;
				result = this.matchBlockUnfold_axis(x1, y1, x2, y2, x3, y3, true);
				if (result) {
					return result;
				}
			}
		}
		return null;
    }

    matchBlockUnfold_axis(x1, y1, x2, y2, x3, y3, isAxis_X){
        let tmpXY = [];
        if (this.initChessBoard._canvasGrids[x3 + 1][y3 + 1] <= this._TYPE_INIT) {
			tmpXY = this.matchBlockCorner(x3, y3, x2, y2, isAxis_X);
			if (tmpXY) {
				return [x3, y3].concat(tmpXY);;
			}
        }
        return null;
    }
    


    clearLinked(x1, y1, x2, y2){
        this.boom_Animaton(x1, y1, x2, y2);
		// this.judge_time = 0;
		this.initChessBoard._canvasGrids[x1 + 1][y1 + 1] = this._TYPE_DELED;
		this.initChessBoard._canvasGrids[x2 + 1][y2 + 1] = this._TYPE_DELED;
		//cc.audioEngine.playEffect(this.SuccessAudio, false);
		//createjs.Sound.play("links")
		// this.pairs -= 1;
		// this.progs++;
		//this.greenNOone();
		//当全部消除之后，调用
		// if (this.pairs == 0) {
		// 	this.send_win();
		// }
    }

    boom_Animaton(x1, y1, x2, y2){
		this.initChessBoard.chessNdArr[x1][y1].scale = 1;
		this.initChessBoard.chessNdArr[x2][y2].scale = 1;
		this.initChessBoard.chessNdArr[x1][y1].getComponent(cc.Sprite).spriteFrame = null;
		this.initChessBoard.chessNdArr[x2][y2].getComponent(cc.Sprite).spriteFrame = null;

				//消除连线
				this.scheduleOnce(()=> {
					this.initChessBoard.chessNdArr[x1][y1].removeAllChildren();
					this.initChessBoard.chessNdArr[x2][y2].removeAllChildren();
					 if (this.temp_lines.length > 0) {
						for (var i = 0; i < this.temp_lines.length; i++) {
							this.temp_lines[i].removeAllChildren();
						}
					 	this.temp_lines = [];
					 }
					// self.judege_lastTen();
				}, 0.05);
	}

		/**
	 * 左上拐
	 */
	roundLeftUp(x1, x2, y1, y2, round_x, round_y) {
		var h_lines = cc.instantiate(this.h_linePrefab);
		var s_lines = cc.instantiate(this.s_linePrefab);
		if (x1 > round_x) {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[round_x][round_y].x;
			this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[round_x][round_y].y - this.initChessBoard.chessNdArr[x2][y2].y;
			this.initChessBoard.chessNdArr[x2][y2].addChild(s_lines, -99);
		} else {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[round_x][round_y].x;
			this.initChessBoard.chessNdArr[x2][y2].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[round_x][round_y].y - this.initChessBoard.chessNdArr[x1][y1].y;
			this.initChessBoard.chessNdArr[x1][y1].addChild(s_lines, -99);
		}
		h_lines.height = temp_x - h_lines.height / 2;
		h_lines.x=(-h_lines.height / 2);
		s_lines.height = temp_y - s_lines.height / 2;
		s_lines.y=(s_lines.height / 2);
		//拐角
		var round_line = cc.instantiate(this.round_Prefab);
		this.initChessBoard.chessNdArr[round_x][round_y].addChild(round_line, -99);
		this.temp_lines.push(this.initChessBoard.chessNdArr[round_x][round_y]);


	}


		/**
	 * 右上拐
	 */
	roundRightUp (x1, x2, y1, y2, round_x, round_y) {
		var h_lines = cc.instantiate(this.h_linePrefab);
		var s_lines = cc.instantiate(this.s_linePrefab);
		if (x1 < round_x) {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[round_x][round_y].x - this.initChessBoard.chessNdArr[x1][y1].x;
			this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[round_x][round_y].y - this.initChessBoard.chessNdArr[x2][y2].y;
			this.initChessBoard.chessNdArr[x2][y2].addChild(s_lines, -99);
		} else {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[round_x][round_y].x - this.initChessBoard.chessNdArr[x2][y2].x;
			this.initChessBoard.chessNdArr[x2][y2].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[round_x][round_y].y - this.initChessBoard.chessNdArr[x1][y1].y;
			this.initChessBoard.chessNdArr[x1][y1].addChild(s_lines, -99);
		}
		h_lines.height = temp_x - h_lines.height / 2;
		h_lines.x=(h_lines.height / 2);
		s_lines.height = temp_y - s_lines.height / 2;
		s_lines.y=(s_lines.height / 2);
		//拐角
		var round_line = cc.instantiate(this.round_Prefab);
		round_line.rotation = 90;
		this.initChessBoard.chessNdArr[round_x][round_y].addChild(round_line, -99);
		this.temp_lines.push(this.initChessBoard.chessNdArr[round_x][round_y]);
	}


		/**
	 * 左下拐
	 */
	roundLeftDown (x1, x2, y1, y2, round_x, round_y) {
		var h_lines = cc.instantiate(this.h_linePrefab);
		var s_lines = cc.instantiate(this.s_linePrefab);
		if (y1 > round_y) {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[round_x][round_y].x;
			this.initChessBoard.chessNdArr[x2][y2].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[round_x][round_y].y;
			this.initChessBoard.chessNdArr[x1][y1].addChild(s_lines, -99);
		} else {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[round_x][round_y].x;
			this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[round_x][round_y].y;
			this.initChessBoard.chessNdArr[x2][y2].addChild(s_lines, -99);
		}
		h_lines.height = temp_x - h_lines.height / 2;
		h_lines.x=(-h_lines.height / 2);
		s_lines.height = temp_y - s_lines.height / 2;
		s_lines.y=(-s_lines.height / 2);
		//拐角
		var round_line = cc.instantiate(this.round_Prefab);
		round_line.rotation = 270;
		this.initChessBoard.chessNdArr[round_x][round_y].addChild(round_line, -99);
		this.temp_lines.push(this.initChessBoard.chessNdArr[round_x][round_y]);
	}


	/**
	 * 右下拐
	 */
	roundRightDown(x1, x2, y1, y2, round_x, round_y) {
		var h_lines = cc.instantiate(this.h_linePrefab);
		var s_lines = cc.instantiate(this.s_linePrefab);
		if (x2 < round_x) {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[round_x][round_y].x - this.initChessBoard.chessNdArr[x2][y2].x;
			this.initChessBoard.chessNdArr[x2][y2].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[round_x][round_y].y;
			this.initChessBoard.chessNdArr[x1][y1].addChild(s_lines, -99);
		} else {
			//横线
			var temp_x = this.initChessBoard.chessNdArr[round_x][round_y].x - this.initChessBoard.chessNdArr[x1][y1].x;
			this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
			//竖线
			var temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[round_x][round_y].y;
			this.initChessBoard.chessNdArr[x2][y2].addChild(s_lines, -99);
		}
		h_lines.height = temp_x - h_lines.height / 2;
		h_lines.x=(h_lines.height / 2);
		s_lines.height = temp_y - s_lines.height / 2;
		s_lines.y=(-s_lines.height / 2);
		//拐角
		var round_line = cc.instantiate(this.round_Prefab);
		round_line.rotation = 180;
		this.initChessBoard.chessNdArr[round_x][round_y].addChild(round_line, -99);
		this.temp_lines.push(this.initChessBoard.chessNdArr[round_x][round_y]);
	}


	//直线连接连线
	drawBeeLine(x1, y1, x2, y2){
		//垂直方向连线
		if (x1 === x2) {
			let temp_y = Math.abs(this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[x2][y2].y);
			let lines = cc.instantiate(this.s_linePrefab);
			lines.height = temp_y;
			if (y1 > y2) {
				lines.y =-lines.height / 2;
			} else if (y1 < y2) {
				lines.y = lines.height / 2;
			}
			this.initChessBoard.chessNdArr[x1][y1].addChild(lines, -99);
			//水平方向连线
		} else if (y1 == y2) {
			let temp_x = Math.abs(this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[x2][y2].x);
			let lines = cc.instantiate(this.h_linePrefab);
			lines.height = temp_x;
			if (x1 > x2) {
				lines.x=(-lines.height / 2);
			} else if (x1 < x2) {
				lines.x=(lines.height / 2);
			}
			this.initChessBoard.chessNdArr[x1][y1].addChild(lines, -99);
		}
	}


	//一个转角线
	drawOneCornerLine(x1, y1, x2, y2,tmpXY){
		let round_x = tmpXY[0];
				let round_y = tmpXY[1];
				if ((round_x < x1 && round_x == x2 && round_y == y1 && round_y > y2) || (round_x == x1 && round_x < x2 && round_y == y2 && round_y > y1)) {
					this.roundLeftUp(x1, x2, y1, y2, round_x, round_y);
				} else if ((round_x == x1 && round_x > x2 && round_y == y2 && round_y > y1) || (round_x == x2 && round_x > x1 && round_y == y1 && round_y > y2)) {
					this.roundRightUp(x1, x2, y1, y2, round_x, round_y);
				} else if ((round_x == x1 && round_x < x2 && round_y < y1 && round_y == y2) || (round_x < x1 && round_x == x2 && round_y == y1 && round_y < y2)) {
					this.roundLeftDown(x1, x2, y1, y2, round_x, round_y);
				} else {
					this.roundRightDown(x1, x2, y1, y2, round_x, round_y);
				}
	}

	onLine(x1, y1, x2, y2) {
		let tmpXY = [];
		this.initChessBoard.chessNdArr[x1][y1].scale=1
		this.initChessBoard.chessNdArr[x2][y2].scale=1;
		if (this.matchBlockLine(x1, y1, x2, y2)) {
			//直线连接连线
			this.drawBeeLine(x1, y1, x2, y2)
		} else {
			//--------------------------------------------------------------
			tmpXY = this.matchBlockCorner(x1, y1, x2, y2, null)
			if (tmpXY) {
				// 一个转角
				this.drawOneCornerLine(x1, y1, x2, y2,tmpXY);
			} else {
				tmpXY = this.matchBlockUnfold(x1, y1, x2, y2);
				//判断拐点是否在棋盘外
				if (tmpXY) {
					// 两个转角
					let round_x1 = tmpXY[0];
					let round_y1 = tmpXY[1];
					let round_x2 = tmpXY[2];
					let round_y2 = tmpXY[3];
					if (x1 > round_x1) {
						//第一条左横线
						//在拐点棋盘左外面
						if (round_x1 < 0 || round_x2 < 0) {
							if (round_y1 > round_y2) {
								//左上拐点
								//左边横线
								let temp_x = this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[0][y1].x;
								let h_line = cc.instantiate(this.h_linePrefab);
								h_line.height = temp_x + this.out_line_size;
								h_line.x=(-h_line.height / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(h_line, -99);
								//添加拐点
								let round_line = cc.instantiate(this.round_Prefab);
								round_line.rotation = 0;
								round_line.x=(-h_line.height - this.pic_size / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);
								//竖线
								let temp_y = this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[x2][y2].y;
								let s_line = cc.instantiate(this.s_linePrefab);
								s_line.height = temp_y - s_line.height;
								s_line.x=(-h_line.height - this.pic_size / 2);
								s_line.y = -s_line.height / 2 - this.pic_size / 2;
								this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
								//横线
								let temp_x_h = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[0][y2].x
								let h_line_h = cc.instantiate(this.h_linePrefab);
								h_line_h.height = temp_x_h + this.out_line_size;
								h_line_h.x=(-h_line_h.height / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_line_h, -99);

								//添加左下拐点
								let round_lines = cc.instantiate(this.round_Prefab);
								round_lines.rotation = 270;
								round_lines.x=(-h_line_h.height - this.pic_size / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(round_lines, -99);
							} else if (round_y1 < round_y2) {
								//左下拐点
								//左边横线
								let temp_x = this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[0][y1].x;
								let h_line = cc.instantiate(this.h_linePrefab);
								h_line.height = temp_x + this.out_line_size;
								h_line.x=(-h_line.height / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(h_line, -99);
								//添加拐点
								let round_line = cc.instantiate(this.round_Prefab);
								round_line.rotation = 270;
								round_line.x=(-h_line.height - this.pic_size / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);
								//添加竖线
								let temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[x1][y1].y;
								let s_line = cc.instantiate(this.s_linePrefab);
								s_line.height = temp_y - s_line.height;
								s_line.x=(-h_line.height - this.pic_size / 2);
								s_line.y=s_line.height / 2 + this.pic_size / 2;
								this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
								//左边横线
								let temp_x = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[0][y1].x;
								let h_line = cc.instantiate(this.h_linePrefab);
								h_line.height = temp_x + this.out_line_size;
								h_line.x=(-h_line.height / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_line, -99);
								//添加拐点
								let round_line = cc.instantiate(this.round_Prefab);
								round_line.rotation = 0;
								round_line.x=(-h_line.height - this.pic_size / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(round_line, -99);
							}
						} else {
							//----------------------
							let temp_x = this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[round_x1][round_y1].x;
							let h_lines = cc.instantiate(this.h_linePrefab);
							h_lines.height = temp_x - h_lines.height / 2;
							h_lines.x=(-h_lines.height / 2);
							this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
							if (round_y1 - round_y2 > 0) {
								//左上,拐角
								let round_line = cc.instantiate(this.round_Prefab);
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_line, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
								//向下竖线
								let temp_y = this.initChessBoard.chessNdArr[round_x1][round_y1].y - this.initChessBoard.chessNdArr[round_x2][round_y2].y;
								let s_lines = cc.instantiate(this.s_linePrefab);
								s_lines.height = temp_y - s_lines.height;
								s_lines.y =-s_lines.height / 2 - this.pic_size / 2;
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(s_lines, -99);
								let round_lines = cc.instantiate(this.round_Prefab);
								let h_linest = cc.instantiate(this.h_linePrefab);
								if (x2 > round_x2) {
									//左下拐角
									round_lines.rotation = 270;
									//向右横线
									let temp_x2 = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[round_x2][round_y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(-h_linest.height / 2);
								} else if (x2 < round_x2) {
									//右下拐角
									round_lines.rotation = 180;
									//向左横线
									let temp_x2 = this.initChessBoard.chessNdArr[round_x2][round_y2].x - this.initChessBoard.chessNdArr[x2][y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(h_linest.height / 2);
								}
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_linest, -99);
								this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
							} else if (round_y1 - round_y2 < 0) {
								//左下,拐角
								let round_line = cc.instantiate(this.round_Prefab);
								round_line.rotation = 270;
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_line, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
								//向上竖线
								let temp_y = this.initChessBoard.chessNdArr[round_x2][round_y2].y - this.initChessBoard.chessNdArr[round_x1][round_y1].y;
								let s_lines = cc.instantiate(this.s_linePrefab);
								s_lines.height = temp_y - s_lines.height;
								s_lines.y=s_lines.height / 2 + this.pic_size / 2;
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(s_lines, -99);
								let round_lines = cc.instantiate(this.round_Prefab);
								let h_linest = cc.instantiate(this.h_linePrefab);
								if (x2 > round_x2) {
									//左上拐角
									round_lines.rotation = 0;
									//向右横线
									let temp_x2 = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[round_x2][round_y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(-h_linest.height / 2);
								} else if (x2 < round_x2) {
									//右上拐角
									round_lines.rotation = 90;
									//向左横线
									let temp_x2 = this.initChessBoard.chessNdArr[round_x2][round_y2].x - this.initChessBoard.chessNdArr[x2][y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(h_linest.height / 2);
								}
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_linest, -99);
								this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
							}
							//-----------------------
						}
					} else if (x1 - round_x1 < 0) {
						//第一条右横线
						if (round_x1 >= this.rows || round_x2 >= this.rows) {
							if (round_y1 > round_y2) {
								//右上拐角
								//右边横线
								let temp_x = this.initChessBoard.chessNdArr[this.rows - 1][y1].x - this.initChessBoard.chessNdArr[x1][y1].x;
								let h_line = cc.instantiate(this.h_linePrefab);
								h_line.height = temp_x + this.out_line_size;
								h_line.x=(h_line.height / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(h_line, -99);

								//添加拐点
								let round_line = cc.instantiate(this.round_Prefab);
								round_line.rotation = 90;
								round_line.x=(h_line.height + this.pic_size / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);

								//竖线
								let temp_y = this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[x2][y2].y;
								let s_line = cc.instantiate(this.s_linePrefab);
								s_line.height = temp_y - s_line.height;
								s_line.x=h_line.height + this.pic_size / 2;
								s_line.y = -s_line.height / 2 - this.pic_size / 2;
								this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
								//横线
								let temp_x_h = this.initChessBoard.chessNdArr[this.rows - 1][y2].x - this.initChessBoard.chessNdArr[x2][y2].x;
								let h_line_h = cc.instantiate(this.h_linePrefab);
								h_line_h.height = temp_x_h + this.out_line_size;
								h_line_h.x=(h_line_h.height / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_line_h, -99);
								//添加右下拐点
								let round_lines = cc.instantiate(this.round_Prefab);
								round_lines.rotation = 180;
								round_lines.x=(h_line_h.height + this.pic_size / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(round_lines, -99);
							} else if (round_y1 < round_y2) {
								//右下拐角
								//右边横线
								let temp_x = this.initChessBoard.chessNdArr[this.rows - 1][y1].x - this.initChessBoard.chessNdArr[x1][y1].x;
								let h_line = cc.instantiate(this.h_linePrefab);
								h_line.height = temp_x + this.out_line_size;
								h_line.x=(h_line.height / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(h_line, -99);
								//添加拐点
								let round_line = cc.instantiate(this.round_Prefab);
								round_line.rotation = 180;
								round_line.x=(h_line.height + this.pic_size / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);
								//竖线
								let temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[x1][y1].y;
								let s_line = cc.instantiate(this.s_linePrefab);
								s_line.height = temp_y - s_line.height;
								s_line.x = h_line.height + this.pic_size / 2;
								s_line.y = s_line.height / 2 + this.pic_size / 2;
								this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
								//横线
								let temp_x_h = this.initChessBoard.chessNdArr[this.rows - 1][y2].x - this.initChessBoard.chessNdArr[x2][y2].x;
								let h_line_h = cc.instantiate(this.h_linePrefab);
								h_line_h.height = temp_x_h + this.out_line_size;
								h_line_h.x=(h_line_h.height / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_line_h, -99);
								//添加拐点
								let round_lines = cc.instantiate(this.round_Prefab);
								round_lines.rotation = 90;
								round_lines.x=(h_line_h.height + this.pic_size / 2);
								this.initChessBoard.chessNdArr[x2][y2].addChild(round_lines, -99);
							}
						} else {
							let temp_x = this.initChessBoard.chessNdArr[round_x1][round_y1].x - this.initChessBoard.chessNdArr[x1][y1].x;
							let h_lines = cc.instantiate(this.h_linePrefab);
							h_lines.height = temp_x - h_lines.height / 2;
							h_lines.x=(h_lines.height / 2);
							this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
							if (round_y1 > round_y2) {
								//右上拐角
								let round_lines = cc.instantiate(this.round_Prefab);
								round_lines.rotation = 90;
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_lines, -99);
								//向下竖线
								let temp_y = this.initChessBoard.chessNdArr[round_x1][round_y1].y - this.initChessBoard.chessNdArr[round_x2][round_y2].y;
								let s_lines = cc.instantiate(this.s_linePrefab);
								s_lines.height = temp_y - s_lines.height;
								s_lines.y = -s_lines.height / 2 - this.pic_size / 2;
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(s_lines, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
								let round_lines = cc.instantiate(this.round_Prefab);
								let h_linest = cc.instantiate(this.h_linePrefab);
								if (x2 > round_x2) {
									//左下拐角
									round_lines.rotation = 270;
									//向右横线
									let temp_x2 = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[round_x2][round_y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(-h_linest.height / 2);
								} else if (x2 < round_x2) {
									//右下拐角
									round_lines.rotation = 180;
									//向左横线
									let temp_x2 = this.initChessBoard.chessNdArr[round_x2][round_y2].x - this.initChessBoard.chessNdArr[x2][y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(h_linest.height / 2);
								}
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_linest, -99);
								this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);

							} else if (round_y1 < round_y2) {
								//右下拐角
								let round_line = cc.instantiate(this.round_Prefab);
								round_line.rotation = 180;
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_line, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);

								//向上竖线
								let temp_y = this.initChessBoard.chessNdArr[round_x2][round_y2].y - this.initChessBoard.chessNdArr[round_x1][round_y1].y;
								let s_lines = cc.instantiate(this.s_linePrefab);
								s_lines.height = temp_y - s_lines.height;
								s_lines.y=s_lines.height / 2 + this.pic_size / 2;
								this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(s_lines, -99);

								let round_lines = cc.instantiate(this.round_Prefab);
								let h_linest = cc.instantiate(this.h_linePrefab);
								if (x2 > round_x2) {
									//左上拐角
									round_lines.rotation = 0;
									//向右横线
									let temp_x2 = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[round_x2][round_y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(-h_linest.height / 2);
								} else if (x2 < round_x2) {
									//右上拐角
									round_lines.rotation = 90;
									//向左横线
									let temp_x2 = this.initChessBoard.chessNdArr[round_x2][round_y2].x - this.initChessBoard.chessNdArr[x2][y2].x;
									h_linest.height = temp_x2 - h_linest.height / 2;
									h_linest.x=(h_linest.height / 2);
								}
								this.initChessBoard.chessNdArr[x2][y2].addChild(h_linest, -99);
								this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
								this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
							}
						}
					} else {
						if (y1 > round_y1) {
							//第一条向下竖线
							if (round_y1 < 0 || round_y2 < 0) {
								if (round_x1 < round_x2) {
									//左下拐点
									//竖线
									let temp_y = this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[x1][0].y;
									let s_line = cc.instantiate(this.s_linePrefab);
									s_line.height = temp_y + this.out_line_size;
									s_line.y=-s_line.height / 2;
									this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
									//添加拐点
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 270;
									round_line.y=-s_line.height - this.pic_size / 2;
									this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);
									//添加横线
									let temp_x = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[x1][y1].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x=h_lines.height / 2 + this.pic_size / 2;
									h_lines.y=-s_line.height - this.pic_size / 2;
									this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
									//竖线
									let temp_ty = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[x2][0].y;
									let s_linet = cc.instantiate(this.s_linePrefab);
									s_linet.height = temp_ty + this.out_line_size;
									s_linet.y = -s_linet.height / 2;
									this.initChessBoard.chessNdArr[x2][y2].addChild(s_linet, -99);
									//添加右下拐点
									let round_lines = cc.instantiate(this.round_Prefab);
									round_lines.rotation = 180;
									round_lines.y=-s_linet.height - this.pic_size / 2;
									this.initChessBoard.chessNdArr[x2][y2].addChild(round_lines, -99);
								} else if (round_x1 > round_x2) {
									//右下拐点
									//竖线
									let temp_y = this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[x1][0].y;
									let s_line = cc.instantiate(this.s_linePrefab);
									s_line.height = temp_y + this.out_line_size;
									s_line.y=-s_line.height / 2;
									this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
									//添加拐点
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 180;
									round_line.y=-s_line.height - this.pic_size / 2;
									this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);
									//添加横线
									let temp_x = this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[x2][y2].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x = -h_lines.height / 2 - this.pic_size / 2;
									h_lines.y=-s_line.height - this.pic_size / 2;
									this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
									//竖线
									let temp_ty = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[x2][0].y;
									let s_linet = cc.instantiate(this.s_linePrefab);
									s_linet.height = temp_ty + this.out_line_size;
									s_linet.y=-s_linet.height / 2;
									this.initChessBoard.chessNdArr[x2][y2].addChild(s_linet, -99);
									//添加左下拐点
									let round_lines = cc.instantiate(this.round_Prefab);
									round_lines.rotation = 270;
									round_lines.y = -s_linet.height - this.pic_size / 2;
									this.initChessBoard.chessNdArr[x2][y2].addChild(round_lines, -99);
								}
							} else {
								let temp_length_y = this.initChessBoard.chessNdArr[x1][y1].y - this.initChessBoard.chessNdArr[round_x1][round_y1].y;
								let f_s_line = cc.instantiate(this.s_linePrefab);
								f_s_line.height = temp_length_y - f_s_line.height / 2;
								f_s_line.y = -f_s_line.height / 2;
								this.initChessBoard.chessNdArr[x1][y1].addChild(f_s_line, -99);
								if (round_x1 > round_x2) {
									//右下拐角
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 180;
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_line, -99);
									// this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
									//向左横线
									let temp_x = this.initChessBoard.chessNdArr[round_x1][round_y1].x - this.initChessBoard.chessNdArr[round_x2][round_y2].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x=(-h_lines.height / 2 - this.pic_size / 2);
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(h_lines, -99);
									this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
									if (y2 > round_y2) {
										//左下拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 270;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向上竖线
										let T_temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[round_x2][round_y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y= -T_h_lines.height / 2;
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);
									} else if (y2 < round_y2) {
										//左上拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 0;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向下竖线
										let T_temp_y = this.initChessBoard.chessNdArr[round_x2][round_y2].y - this.initChessBoard.chessNdArr[x2][y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y=(T_h_lines.height / 2);
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);
									}

								} else if (round_x1 < round_x2) {
									//左下拐角
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 270;
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_line, -99);
									//向右横线
									let temp_x = this.initChessBoard.chessNdArr[round_x2][round_y2].x - this.initChessBoard.chessNdArr[round_x1][round_y1].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x=(h_lines.height / 2 + this.pic_size / 2);
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(h_lines, -99);
									this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
									if (y2 > round_y2) {
										//右下拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 180;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向上竖线
										let T_temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[round_x2][round_y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y=(-T_h_lines.height / 2);
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);

									} else if (y2 < round_y2) {
										//右上拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 90;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向下竖线
										let T_temp_y = this.initChessBoard.chessNdArr[round_x2][round_y2].y - this.initChessBoard.chessNdArr[x2][y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y=(T_h_lines.height / 2);
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);
									}
								}
							}
						} else if (y1 < round_y1) {
							//第一条向上竖线
							if (round_y1 >= this.columns || round_y2 >= this.columns) {

								if (round_x1 < round_x2) {
									//左上
									//竖线
									let temp_y = this.initChessBoard.chessNdArr[x1][this.columns - 1].y - this.initChessBoard.chessNdArr[x1][y1].y;
									let s_line = cc.instantiate(this.s_linePrefab);
									s_line.height = temp_y + this.out_line_size;
									s_line.y=(s_line.height / 2);
									this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
									//添加拐点
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 0;
									round_line.y=(s_line.height + this.pic_size / 2);
									this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);
									//添加横线
									let temp_x = this.initChessBoard.chessNdArr[x2][y2].x - this.initChessBoard.chessNdArr[x1][y1].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x=(h_lines.height / 2 + this.pic_size / 2);
									h_lines.y=(s_line.height + this.pic_size / 2);
									this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
									//竖线
									let temp_ty = this.initChessBoard.chessNdArr[x2][this.columns - 1].y - this.initChessBoard.chessNdArr[x2][y2].y;
									let s_linet = cc.instantiate(this.s_linePrefab);
									s_linet.height = temp_ty + this.out_line_size;
									s_linet.y=(s_linet.height / 2);
									this.initChessBoard.chessNdArr[x2][y2].addChild(s_linet, -99);
									//添加右下拐点
									let round_lines = cc.instantiate(this.round_Prefab);
									round_lines.rotation = 90;
									round_lines.y=(s_linet.height + this.pic_size / 2);
									this.initChessBoard.chessNdArr[x2][y2].addChild(round_lines, -99);

								} else if (round_x1 > round_x2) {
									//右上
									//竖线
									let temp_y = this.initChessBoard.chessNdArr[x1][this.columns - 1].y - this.initChessBoard.chessNdArr[x1][y1].y;
									let s_line = cc.instantiate(this.s_linePrefab);
									s_line.height = temp_y + this.out_line_size;
									s_line.y=(s_line.height / 2);
									this.initChessBoard.chessNdArr[x1][y1].addChild(s_line, -99);
									//添加拐点
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 90;
									round_line.y=(s_line.height + this.pic_size / 2);
									this.initChessBoard.chessNdArr[x1][y1].addChild(round_line, -99);
									//添加横线
									let temp_x = this.initChessBoard.chessNdArr[x1][y1].x - this.initChessBoard.chessNdArr[x2][y2].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x=(-h_lines.height / 2 - this.pic_size / 2);
									h_lines.y=(s_line.height + this.pic_size / 2);
									this.initChessBoard.chessNdArr[x1][y1].addChild(h_lines, -99);
									//竖线
									let temp_ty = this.initChessBoard.chessNdArr[x2][this.columns - 1].y - this.initChessBoard.chessNdArr[x2][y2].y;
									let s_linet = cc.instantiate(this.s_linePrefab);
									s_linet.height = temp_ty + this.out_line_size;
									s_linet.y=(s_linet.height / 2);
									this.initChessBoard.chessNdArr[x2][y2].addChild(s_linet, -99);
									//添加右下拐点
									let round_lines = cc.instantiate(this.round_Prefab);
									round_lines.rotation = 0;
									round_lines.y=(s_linet.height + this.pic_size / 2);
									this.initChessBoard.chessNdArr[x2][y2].addChild(round_lines, -99);
								}

							} else {
								//-----------------------
								let temp_y = this.initChessBoard.chessNdArr[round_x1][round_y1].y - this.initChessBoard.chessNdArr[x1][y1].y;
								let s_lines = cc.instantiate(this.s_linePrefab);
								s_lines.height = temp_y - s_lines.height / 2;
								s_lines.y=(s_lines.height / 2);
								this.initChessBoard.chessNdArr[x1][y1].addChild(s_lines, -99);

								if (round_x1 < round_x2) {
									//左上拐角
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 0;
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_line, -99);
									//向右横线
									let temp_x = this.initChessBoard.chessNdArr[round_x2][round_y2].x - this.initChessBoard.chessNdArr[round_x1][round_y1].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x=(h_lines.height / 2 + this.pic_size / 2);
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(h_lines, -99);
									this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
									if (y2 > round_y2) {
										//右下拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 180;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向上竖线
										let T_temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[round_x2][round_y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y=(-T_h_lines.height / 2);
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);
									} else if (y2 < round_y2) {
										//右上拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 90;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向下竖线
										let T_temp_y = this.initChessBoard.chessNdArr[round_x2][round_y2].y - this.initChessBoard.chessNdArr[x2][y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y=(T_h_lines.height / 2);
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);
									}

								} else if (round_x1 > round_x2) {
									//右上拐角
									let round_line = cc.instantiate(this.round_Prefab);
									round_line.rotation = 90;
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(round_line, -99);
									//向左横线
									let temp_x = this.initChessBoard.chessNdArr[round_x1][round_y1].x - this.initChessBoard.chessNdArr[round_x2][round_y2].x;
									let h_lines = cc.instantiate(this.h_linePrefab);
									h_lines.height = temp_x - h_lines.height;
									h_lines.x=(-h_lines.height / 2 - this.pic_size / 2);
									this.initChessBoard.chessNdArr[round_x1][round_y1].addChild(h_lines, -99);
									this.temp_lines.push(this.initChessBoard.chessNdArr[round_x1][round_y1]);
									if (y2 > round_y2) {
										//左下拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 270;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向上竖线
										let T_temp_y = this.initChessBoard.chessNdArr[x2][y2].y - this.initChessBoard.chessNdArr[round_x2][round_y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y=(-T_h_lines.height / 2);
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);

									} else if (y2 < round_y2) {
										//左上拐角
										let round_lines = cc.instantiate(this.round_Prefab);
										round_lines.rotation = 0;
										this.initChessBoard.chessNdArr[round_x2][round_y2].addChild(round_lines, -99);
										this.temp_lines.push(this.initChessBoard.chessNdArr[round_x2][round_y2]);
										//向下竖线
										let T_temp_y = this.initChessBoard.chessNdArr[round_x2][round_y2].y - this.initChessBoard.chessNdArr[x2][y2].y;
										let T_h_lines = cc.instantiate(this.s_linePrefab);
										T_h_lines.height = T_temp_y - T_h_lines.height / 2;
										T_h_lines.y=(T_h_lines.height / 2);
										this.initChessBoard.chessNdArr[x2][y2].addChild(T_h_lines, -99);
									}
								}
							}

						}
					}


				}
			}
		}
	}

    // update (dt) {}
}
