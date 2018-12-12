import { chessBoardMsg } from './Utils';

const {ccclass, property} = cc._decorator;

@ccclass
export  class InitChessBoard extends cc.Component {

    @property(cc.Node)
    chessBoardN: cc.Node = null;
   
    @property(cc.SpriteFrame)
    chessSprArr: cc.SpriteFrame[] = []

    @property(cc.Prefab)
    chessP: cc.Prefab = null

    chessNdArr:any
    _canvasGrids:any
    // LIFE-CYCLE CALLBACKS:

    onLoad () {

        this._canvasGrids = [];
		for (var i = 0; i < chessBoardMsg.row + 2; i++) {
			this._canvasGrids[i] = []; //在声明二维
			for (var j = 0; j < chessBoardMsg.row + 2; j++) {
				this._canvasGrids[i][j] = -1;
			}
		}
		this.chessNdArr = [];
		for (var i = 0; i < chessBoardMsg.row; i++) {
			this.chessNdArr[i] = []; //在声明二维
			for (var j = 0; j < chessBoardMsg.row; j++) {
				this.chessNdArr[i][j] = null;
			}
        }
        this.initData();
        
    }


    initData () {
		for (let row = 0; row < chessBoardMsg.row; row++) {
			for (let column = 0; column < chessBoardMsg.column / 2; column++) {
				var newNode = cc.instantiate(this.chessP); //复制预制资源
				var type = Math.floor(Math.random() * this.chessSprArr.length);
                newNode.getComponent(cc.Sprite).spriteFrame = this.chessSprArr[type];
                newNode.getComponent('Chess').type = type;
				var newNodeTwo = cc.instantiate(this.chessP);
				newNodeTwo.getComponent(cc.Sprite).spriteFrame = this.chessSprArr[type];
				newNodeTwo.getComponent('Chess').type = type;
				this.chessNdArr[row][column] = newNode;
				var x_two = chessBoardMsg.row - row - 1;
				var y_two = chessBoardMsg.column - column - 1;
				this.chessNdArr[x_two][y_two] = newNodeTwo;
				// type >= 0，为实际的图片类型值
				this._canvasGrids[row + 1][column + 1] = type;
				this._canvasGrids[chessBoardMsg.row - row][chessBoardMsg.column - column] = type;
			}


		}
		this.shuffle();
    }
    
    shuffle () {
		for (var i = chessBoardMsg.row * chessBoardMsg.column - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var x = i % chessBoardMsg.row;
			var y = Math.floor(i / chessBoardMsg.row);
			var x_tmp = j % chessBoardMsg.row;
			var y_tmp = Math.floor(j / chessBoardMsg.row);
			var temp = this.chessNdArr[x][y];
			this.chessNdArr[x][y] = this.chessNdArr[x_tmp][y_tmp];
			this.chessNdArr[x_tmp][y_tmp] = temp;
        }
        this.initMap();
    }


    initMap() {
		var self = this;
		for (var row = 0; row < chessBoardMsg.row; row++) {
			for (var column = 0; column < chessBoardMsg.column ; column++) {
				//设置node的位置
				let chess = this.chessNdArr[row][column];
                this.chessBoardN.addChild(chess);
                let chess_x = -this.chessBoardN.width / 2 + row * chess.width + chess.width / 2 + row * chessBoardMsg.splice
                let chess_y = -this.chessBoardN.height / 2 + column * chess.height + chess.height / 2 + column * chessBoardMsg.splice
				chess.setPosition(cc.v2(chess_x,chess_y));
				chess.getComponent('Chess').pointX = row;
				chess.getComponent('Chess').pointY = column;
		
			}
		}

	}

    start () {

    }

    // update (dt) {}
}
