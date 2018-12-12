const {ccclass, property} = cc._decorator;

@ccclass
export class ControlSize extends cc.Component {

    @property(cc.Node)
    initSize: cc.Node = null;

    // @property
    // text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

     onLoad () {
        console.log("cc.size",cc.winSize);
        let ipHeight = cc.winSize.height;
        if (ipHeight < 1334) {
            console.log("ipHeight / 1334",ipHeight / 1334);
            this.initSize.scale = ipHeight / 1334;
        }
     }

    start () {
        // if(cc.winSize.height < 1334){
        //     this.initSize.scale = 0.5
        // }

    }

    // update (dt) {}
}
