
function DQXDocElement(itype) {

    this.myType = itype;
    this.myAttributes = {};
    this.myStyles = {};
    this.myComponents = [];

    this.AddAttribute = function (id, content) {
        this.myAttributes[id] = '' + content;
    }

    this.AddStyle = function (id, content) {
        this.myStyles[id] = ''+content;
    }

    this.AddComponent = function (icomp) {
        this.myComponents.push(icomp);
    }

    this.toString = function () {
        var rs = '<' + this.myType;

        for (id in this.myAttributes) {
            rs += ' ';
            rs += id + '="' + this.myAttributes[id] + '"';
            first = false;
        }

        rs += ' style="';
        var first = true;
        for (id in this.myStyles) {
            if (!first) rs += ';';
            rs += id + ":" + this.myStyles[id];
            first = false;
        }
        rs += '">\n';

        rs+=this.CreateInnerHtml();

        rs += '\n</' + this.myType + '>\n';
        return rs;
    }

    this.CreateInnerHtml = function () {
        var rs = '';
        for (var compnr in this.myComponents) {
            rs += this.myComponents[compnr].toString();
        }
        return rs;
    }


}



function DQXDocElement_Select() {
    var that = new DQXDocElement("select");
    that.AddStyle("background-color","#AAAAAA");
    that.AddStyle("border-width", "0px");
    return that;
}


function DQXDocElement_Edit() {
    var that = new DQXDocElement("input");
    that.AddStyle("background-color", "#AAAAAA");
    that.AddStyle("border-width", "0px");
    return that;
}

function DQXDocElement_JavaScriptlink(content,functionstr) {
    var that = new DQXDocElement("a");
    that.AddAttribute("href", "javascript:void(0)");
    that.AddAttribute("onclick", functionstr);
    that.AddComponent(content);
    return that;
}



function DQXQryBuilder_CleanUp(comp) {
    var modified = false;
    if (comp.IsCompound) {
        for (var compnr in comp.Components) {
            if (DQXQryBuilder_CleanUp(comp.Components[compnr]))
                modified = true;
        }
        var compnr = 0;
        while (compnr < comp.Components.length) {
            var trycomp = comp.Components[compnr];
            var todelete = false;
            if (trycomp.IsCompound) {
                if (trycomp.Tpe == comp.Tpe) {
                    for (var subcompnr in trycomp.Components)
                        comp.Components.splice(compnr+1+subcompnr, 0, trycomp.Components[subcompnr]);
                    trycomp.Components = [];
                    modified = true;
                }
                if (trycomp.Components.length == 0) {
                    todelete = true;
                    modified = true;
                }
                if (trycomp.Components.length == 1) {
                    comp.Components[compnr] = trycomp.Components[0];
                    modified = true;
                }
            }
            if (todelete)
                comp.Components.splice(compnr, 1);
            else
                compnr++;
        }
    }
    return modified;
}

globalcontentnr = 10;


function React(tpe, id) {

    if (tpe == 'Del') {
        if (compmap[id].myParent == null)
            throw "no parent";
        var parentcomp = compmap[id].myParent;
        var childid = -1;
        for (var i in parentcomp.Components)
            if (parentcomp.Components[i].ID == id)
                childid = i;
        if (childid < 0) throw "???";
        parentcomp.Components.splice(childid, 1);
        render();
    }

    if (tpe == 'AddAnd') {
        compmap[id].AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "val "+(globalcontentnr++)));
        render();
    }

    if (tpe == 'AddOr') {
        compmap[id].AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "val " + (globalcontentnr++)));
        render();
    }

    if (tpe == 'CreateOr') {
        var parentcomp = compmap[id].myParent;
        var childid = -1;
        for (var i in parentcomp.Components)
            if (parentcomp.Components[i].ID == id)
                childid = i;
        if (childid < 0) throw "???";
        var orcomp = new DQXWhereClause_OR();
        parentcomp.Components[childid] = orcomp;
        orcomp.AddComponent(compmap[id]);
        orcomp.AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "val " + (globalcontentnr++)));
        render();
    }
    if (tpe == 'CreateAnd') {
        var parentcomp = compmap[id].myParent;
        var childid = -1;
        for (var i in parentcomp.Components)
            if (parentcomp.Components[i].ID == id)
                childid = i;
        if (childid < 0) throw "???";
        var orcomp = new DQXWhereClause_AND();
        parentcomp.Components[childid] = orcomp;
        orcomp.AddComponent(compmap[id]);
        orcomp.AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "val " + (globalcontentnr++)));
        render();
    }
}

function DQXQryBuilder_BuildElement(comp, parentcomp, sizex) {
    comp.myParent = parentcomp;
    compid++;
    var mycompid = compid;
    var thecomp = new DQXDocElement('div');
    comp.ID = compid;
    compmap[compid] = comp;
    thecomp.AddAttribute('id', compid);
    thecomp.AddStyle('float', 'left');
    thecomp.AddStyle('width', sizex + 'px');
    thecomp.H = 0;

    if (comp.IsCompound) {
//        thecomp.AddStyle('height', 'auto');


        if (comp.Tpe == 'AND') {
            thecomp.AddStyle('background-color', 'inherit');
            thecomp.AddStyle('background-image', 'url(vertline1.png)');
            thecomp.AddStyle('background-position', 'center');
            thecomp.AddStyle('background-repeat', 'repeat-y');
            for (var compnr in comp.Components) {
                var needspacer = (compnr > 0);// && (compnr < comp.Components.length-1);
                if (needspacer) {
                    var spacer = new DQXDocElement('div');
                    spacer.AddStyle('float', 'left');
                    spacer.AddStyle('width', sizex + 'px');
                    spacer.AddStyle('height', '20px');
                    thecomp.AddComponent(spacer);
                    thecomp.H += 20;
                }
                var subcomp=new DQXQryBuilder_BuildElement(comp.Components[compnr], comp, sizex);
                thecomp.AddComponent(subcomp);
                thecomp.H += subcomp.H;
            }

            //"add" button
            var spacer = new DQXDocElement('div');
            spacer.AddStyle('float', 'left');
            spacer.AddStyle('width', sizex + 'px');
            spacer.AddStyle('height', '20px');
            spacer.AddStyle('text-align', 'center');
            //spacer.AddStyle('background-color', '#ff0000');
            spacer.AddComponent("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
            spacer.AddComponent(new DQXDocElement_JavaScriptlink("Add condition (AND)", "React('AddAnd'," + mycompid + ")"));
            thecomp.AddComponent(spacer);
            thecomp.H += 20;

        }


        if (comp.Tpe == 'OR') {
            thecomp.AddStyle('background-color', 'inherit');
            var subsize = (sizex - (comp.Components.length-1)*15) / comp.Components.length;
            var subcomps=[];
            for (var compnr in comp.Components) {
                var subcomp = new DQXQryBuilder_BuildElement(comp.Components[compnr], comp, subsize)
                subcomps.push(subcomp);
                thecomp.H = Math.max(thecomp.H, subcomp.H);
            }

            //start point
            var spacer = new DQXDocElement('div');
            spacer.AddStyle('float', 'left');
            spacer.AddStyle('width', sizex + 'px');
            spacer.AddStyle('height', '20px');
            spacer.AddStyle('background-color', '#AAAAAA');
            spacer.AddStyle('text-align', 'center');
            spacer.AddComponent("Alternative paths (OR)")
            spacer.AddComponent(new DQXDocElement_JavaScriptlink("Add another", "React('AddOr'," + mycompid + ")"));
            thecomp.AddComponent(spacer);

            for (compnr in subcomps) {

                if (compnr > 0) {
                    var spacer = new DQXDocElement('div');
                    spacer.AddStyle('float', 'left');
                    spacer.AddStyle('height', thecomp.H+'px');
                    spacer.AddStyle('width', '15px');
                    thecomp.AddComponent(spacer);
                }



                var subcompholder = new DQXDocElement('div');


                subcompholder.AddStyle('float', 'left');
                subcompholder.AddStyle('background-color', 'inherit');
                subcompholder.AddStyle('height', thecomp.H + "px");
                subcompholder.AddStyle('background-image', 'url(vertline1.png)');
                subcompholder.AddStyle('background-position', 'center');
                subcompholder.AddStyle('background-repeat', 'repeat-y');
//                subcompholder.AddStyle('padding-top', '20px');
//                subcompholder.AddStyle('padding-bottom', '25px');
                subcompholder.AddComponent(subcomps[compnr]);
                thecomp.AddComponent(subcompholder);
            }

            //end point
            var spacer = new DQXDocElement('div');
            spacer.AddStyle('float', 'left');
            spacer.AddStyle('width', sizex + 'px');
            spacer.AddStyle('height', '20px');
            spacer.AddStyle('background-color', '#AAAAAA');
            thecomp.AddComponent(spacer);

            thecomp.H += 40;
        }


    }
    else {
        var h = 80;
        //if (sizex < 400) h = 80;
        var addor = (comp.myParent.Tpe != 'OR');
        var addand = (comp.myParent.Tpe != 'AND');
        //        if (addor) sizex -= 30;
        thecomp.AddAttribute('class','querybox');
        thecomp.AddStyle('float', 'left');
        thecomp.AddStyle('width', (sizex) + 'px');
        thecomp.AddStyle('height', (h-10) + 'px');
        thecomp.AddStyle('background-color', 'rgb(150,170,190)');
        thecomp.AddStyle('padding-top', '5px');
        thecomp.AddStyle('padding-bottom', '5px');

        thecomp.AddComponent("&nbsp;" + comp.CompValue);
/*        thecomp.AddComponent("&nbsp;&nbsp;");

        var fieldlist = new DQXDocElement_Select();
        fieldlist.AddStyle('width', '80px');
        thecomp.AddComponent(fieldlist);

        thecomp.AddComponent("&nbsp;&nbsp;");

        var comptype = new DQXDocElement_Select();
        comptype.AddStyle('width', '60px');
        thecomp.AddComponent(comptype);

        thecomp.AddComponent("&nbsp;&nbsp;");

        var compcontent = new DQXDocElement_Edit();
        compcontent.AddStyle('width', '80px');
        thecomp.AddComponent(compcontent);*/

        thecomp.AddComponent(new DQXDocElement_JavaScriptlink("(X)", "React('Del'," + mycompid + ")"));
        thecomp.AddComponent("&nbsp;");

        if (addor) {
            thecomp.AddComponent("&nbsp;");
            thecomp.AddComponent(new DQXDocElement_JavaScriptlink("Create alternative (OR)", "React('CreateOr'," + mycompid + ")"));
            thecomp.AddComponent("&nbsp;");
        }
        if (addand) {
            thecomp.AddComponent("&nbsp;");
            thecomp.AddComponent(new DQXDocElement_JavaScriptlink("Add condition (AND)", "React('CreateAnd'," + mycompid + ")"));
            thecomp.AddComponent("&nbsp;");
        }

        thecomp.H = h;
    }


    return thecomp;
}


function render() {
    compid = 0;
    compmap = {};
    while(DQXQryBuilder_CleanUp(root));

    var sizex = 800;

    var container = new DQXDocElement('div');
    container.AddStyle('float', 'left');
    container.AddStyle('width', sizex + 'px');
    container.AddStyle('background-color', 'inherit');
    //    container.AddStyle('background-color', '#AAAAAA');

    {//start point
        var spacer = new DQXDocElement('div');
        spacer.AddStyle('float', 'left');
        spacer.AddStyle('width', sizex + 'px');
        spacer.AddStyle('height', '40px');
        spacer.AddStyle('background-color', '#AAAABB');
        spacer.AddComponent('Full data set');
        container.AddComponent(spacer);
    }
    {//spacer with arrow
        var spacer = new DQXDocElement('div');
        spacer.AddStyle('background-image', 'url(vertline1.png)');
        spacer.AddStyle('background-position', 'center');
        spacer.AddStyle('background-repeat', 'repeat-y');
        spacer.AddStyle('float', 'left');
        spacer.AddStyle('width', sizex + 'px');
        spacer.AddStyle('height', '20px');
        container.AddComponent(spacer);
    }

    container.AddComponent(DQXQryBuilder_BuildElement(root, null, sizex));

    {//end point
        var spacer = new DQXDocElement('div');
        spacer.AddStyle('float', 'left');
        spacer.AddStyle('width', sizex + 'px');
        spacer.AddStyle('height', '40px');
        spacer.AddStyle('background-color', '#CCAAAA');
        spacer.AddComponent('Final query');
        container.AddComponent(spacer);
    }

    var rs = container.toString();


    $('#id1').html(rs);
}


$(function () {

    //Global initialisation of utilities
    DQX.Init();

    root = DQXWhereClause_AND();

    root.AddComponent(new DQXWhereClause_CompareFixed("field1", "=", "val "+(globalcontentnr++)));
    /*
    root.AddComponent(new DQXWhereClause_CompareFixed("field2", "=", "val2"));

    {
        var scomp = new DQXWhereClause_OR();
        //scomp.AddComponent(DQXWhereClause_AND([new DQXWhereClause_CompareFixed("sfield1", "=", "sval1")]));
        scomp.AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "sval1"));
        scomp.AddComponent(DQXWhereClause_AND([new DQXWhereClause_CompareFixed("sfield1", "=", "sval1"), new DQXWhereClause_CompareFixed("sfield1", "=", "sval1")]));
        root.AddComponent(scomp);
    }

    root.AddComponent(new DQXWhereClause_CompareFixed("field3", "=", "val3"));
    root.AddComponent(new DQXWhereClause_CompareFixed("field4", "=", "val4"));

    {
        var scomp = new DQXWhereClause_OR();
        scomp.AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "sval1"));
        scomp.AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "sval1"));
        scomp.AddComponent(new DQXWhereClause_CompareFixed("sfield1", "=", "sval1"));
        root.AddComponent(scomp);
    }

    root.AddComponent(new DQXWhereClause_CompareFixed("field3", "=", "val3"));
    root.AddComponent(new DQXWhereClause_CompareFixed("field4", "=", "val4"));
    */
    render();
})