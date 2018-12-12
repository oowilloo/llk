
const {ccclass, property} = cc._decorator;

@ccclass
export class Game extends cc.Component {



    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
