Cactus.DOM.Ready.add(function () {
    var log = Cactus.Dev.log;
    var Browser = Cactus.Util.Browser;
    var ListTemplate = Cactus.MVC.View.ListTemplate;
    var Template = Cactus.MVC.View.Template;
    var $f = Cactus.DOM.selectFirst;
    var KVC = Cactus.Util.KeyValueCoding;
    var ArrayController = Cactus.MVC.Model.ArrayController;

    function Pair(first, second) {
        this.first = first;
        this.second = second;
    }
    KVC.implement(Pair);

    var ac = new ArrayController();

    for (var p in Browser) {
        ac.add(new Pair(p, Browser[p]));
    }
    var t = Template.create($f("#tbody *"));
    var lt = ListTemplate.create(t, $f("#tbody"), {
        arrayController : ac
    });

});