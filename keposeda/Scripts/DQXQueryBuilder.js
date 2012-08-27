


DQX.QueryBuilder = function (iDivID) {
    if (!(this instanceof arguments.callee)) throw "Should be called as constructor!";

    DQX.ObjectMapper.Add(this);
    this.myDivID = iDivID;
    this.myColumns = []; //list of DQX.SQL.TableColInfo objects
    this.BSepX = 20;
    this.SpacerH1 = 20; // 30;
    this.SpacerH2 = 15; // 20;
    this.BorderSize = 0;
    this._globalcontentnr = 10;
    this._compid = 0;

    this.notifyModified = function () { } //attach another function here to get notification whenever the query was changed

    if ($('#' + this.myDivID).length == 0)
        throw "Unable to find query builder div element " + this.myDivID;


    this._createNewStatement = function (parent) {
        this._globalcontentnr++;
        var newcomp = {};
        newcomp.IsCompound = false;
        newcomp.myOperator = DQX.SQL.WhereClause.CompareFixed(this.myColumns[0].ID, "=", "");
        parent.Components.push(newcomp);
    }

    this.CreateCompOR = function () {
        var comp = {};
        comp.IsCompound = true;
        comp.Tpe = "OR";
        comp.Components = [];
        return comp;
    }

    this.CreateCompAND = function () {
        var comp = {};
        comp.IsCompound = true;
        comp.Tpe = "AND";
        comp.Components = [];
        return comp;
    }

    this.root = this.CreateCompAND();

    this.AddColumn = function (icolinfo) {
        this.myColumns.push(icolinfo);
    }


    this.HasColumn = function (icolid) {
        for (var i in this.myColumns)
            if (this.myColumns[i].ID == icolid)
                return true;
        return false;
    }

    this.GetColumn = function (icolid) {
        for (var i in this.myColumns)
            if (this.myColumns[i].ID == icolid)
                return this.myColumns[i];
        throw "Invalid column id " + icolid;
    }


    this._cleanUp = function (comp) {
        var modified = false;
        if (comp.IsCompound) {
            for (var compnr in comp.Components) {
                if (this._cleanUp(comp.Components[compnr]))
                    modified = true;
            }
            var compnr = 0;
            while (compnr < comp.Components.length) {
                var trycomp = comp.Components[compnr];
                var todelete = false;
                if (trycomp.IsCompound) {
                    if (trycomp.Tpe == comp.Tpe) {
                        for (var subcompnr in trycomp.Components)
                            comp.Components.splice(compnr + 1 + subcompnr, 0, trycomp.Components[subcompnr]);
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

    this._ReactChangeField = function (id) {
        this.ReRender(); //todo: optimise this by only building single statement
        this.notifyModified();
    }

    this._ReactChangeCompType = function (id) {
        this.ReRender(); //todo: optimise this by only building single statement
        this.notifyModified();
    }

    this._ReactDel = function (id) {
        if (compmap[id].myParent == null)
            throw "no parent";
        var parentcomp = compmap[id].myParent;
        var childid = -1;
        for (var i in parentcomp.Components)
            if (parentcomp.Components[i].ID == id)
                childid = i;
        if (childid < 0) throw "???";
        parentcomp.Components.splice(childid, 1);
        this.ReRender();
        this.notifyModified();
    }

    this._ReactAddAnd = function (id) {
        this._createNewStatement(compmap[id]);
        this.ReRender();
        this.notifyModified();
    }

    this._ReactAddOr = function (id) {
        this._createNewStatement(compmap[id]);
        this.ReRender();
        this.notifyModified();
    }

    this._ReactCreateOr = function (id) {
        var parentcomp = compmap[id].myParent;
        var childid = -1;
        for (var i in parentcomp.Components)
            if (parentcomp.Components[i].ID == id)
                childid = i;
        if (childid < 0) throw "???";
        var orcomp = this.CreateCompOR();
        parentcomp.Components[childid] = orcomp;
        orcomp.Components.push(compmap[id]);
        this._createNewStatement(orcomp);
        this.ReRender();
        this.notifyModified();
    }

    this._ReactCreateRootOr = function () {
        var oldroot = this.root;
        this.root = this.CreateCompAND();
        var orcomp = this.CreateCompOR();
        this.root.Components.push(orcomp);
        orcomp.Components.push(oldroot);
        this._createNewStatement(orcomp);
        this.ReRender();
        this.notifyModified();
    }


    this._ReactCreateAnd = function (id) {
        var parentcomp = compmap[id].myParent;
        var childid = -1;
        for (var i in parentcomp.Components)
            if (parentcomp.Components[i].ID == id)
                childid = i;
        if (childid < 0) throw "???";
        var orcomp = this.CreateCompAND();
        parentcomp.Components[childid] = orcomp;
        orcomp.Components.push(compmap[id]);
        this._createNewStatement(orcomp);
        this.ReRender();
        this.notifyModified();
    }

    this._ReactStatementModified = function (id) {
        this.notifyModified();
    }


    this._calcMinSizeX = function (comp) {
        if (comp.IsCompound) {
            if (comp.Tpe == 'AND') {
                var minsizex = 0;
                for (var compnr in comp.Components) {
                    this._calcMinSizeX(comp.Components[compnr]);
                    minsizex = Math.max(minsizex, comp.Components[compnr].MinSizeX);
                }
                comp.MinSizeX = minsizex;
            }


            if (comp.Tpe == 'OR') {
                var minsizex = 0;
                for (var compnr in comp.Components) {
                    this._calcMinSizeX(comp.Components[compnr]);
                    minsizex += comp.Components[compnr].MinSizeX;
                }
                comp.MinSizeX = minsizex + (comp.Components.length - 1) * this.BSepX;
            }


        }
        else {
            comp.MinSizeX = 200;
        }
    }

    this._calcSizeX = function (comp, availsizex) {
        if (comp.IsCompound) {
            if (comp.Tpe == 'AND') {
                for (var compnr in comp.Components)
                    this._calcSizeX(comp.Components[compnr], availsizex);
                comp.SizeX = availsizex;
            }


            if (comp.Tpe == 'OR') {
                var extrasizex = availsizex - (comp.Components.length - 1) * this.BSepX;
                for (var compnr in comp.Components)
                    extrasizex -= comp.Components[compnr].MinSizeX;
                extrasizex = Math.floor(extrasizex / comp.Components.length);
                for (var compnr in comp.Components) {
                    this._calcSizeX(comp.Components[compnr], comp.Components[compnr].MinSizeX + extrasizex);
                }
                comp.SizeX = availsizex;
            }


        }
        else {
            comp.SizeX = availsizex;
        }
    }


    this._createReactFunctionString = function (itype, iid) {
        return DQX.ObjectMapper.CreateCallBackFunctionString(this, itype, iid);
    }

    this._createBlockColor = function (level) {
        return DQX.ParseColor($('#' + this.myDivID).css("background-color"), DQX.Color(0.9, 0.9, 0.9)).lighten(0.1 * level);
    }

    this.getControlID = function (id, aspect) {
        return "DQXQbldStmnt" + this.myDivID + id + aspect;
    }


    this.decorateQueryStatementControl = function (ctrl, ID) {//adds some extra required stuff around every control that appears in an query statement
        ctrl.setOnChange(this._createReactFunctionString('_ReactStatementModified', ID));
        ctrl.setOnKeyUp(this._createReactFunctionString('_ReactStatementModified', ID));
    }

    this._buildStatement = function (comp, thecomp) {//Render an individual statement
        var myOperator = comp.myOperator;
        var sizex = comp.SizeX;
        var addor = (comp.myParent.Tpe != 'OR');
        var addand = (comp.myParent.Tpe != 'AND');
        thecomp.setCssClass('DQXQBQuerybox');
        thecomp.addStyle('float', 'left');
        thecomp.setWidthPx(sizex - 2 * this.BorderSize);
        thecomp.addStyle('position', 'relative');

        var elem0 = DQX.DocEl.Div({ parent: thecomp });
        //elem0.addStyle('float', 'left');
        //elem0.addStyle('overflow', 'hide');
        elem0.addStyle('text-align', 'center');


        elem0.addStyle('padding-top', '10px');
        elem0.addStyle('padding-bottom', '10px');
        elem0.addStyle('padding-left', '8px');
        elem0.addStyle('padding-right', '8px');

        var elem = DQX.DocEl.Span({ parent: elem0 });

        elem.addElem(" ");

        var thecols = [];
        for (var colnr in this.myColumns) {
            thecols.push({ id: this.myColumns[colnr].ID, name: this.myColumns[colnr].name });
        }
        var fieldlist = DQX.DocEl.Select(thecols, myOperator.ColName);
        fieldlist.setID(this.getControlID(comp.ID, "Field"));
        fieldlist.setWidthPx(150);
        fieldlist.setCssClass('DQXQBQueryboxControl');
        fieldlist.SetChangeEvent(this._createReactFunctionString('_ReactChangeField', comp.ID));
        elem.addElem(fieldlist);

        elem.addElem(" ");

        var compatops = DQX.SQL.WhereClause.GetCompatibleFieldOperators(this.GetColumn(myOperator.ColName).datatype);
        var cmpselectlist = [];
        var foundinlist = false;
        for (var operatornr in compatops) {
            var op = compatops[operatornr];
            cmpselectlist.push({ id: op.ID, name: op.name });
            if (myOperator.Tpe == op.ID) foundinlist = true;
        }
        if (!foundinlist) {
            myOperator.Tpe = cmpselectlist[0].id;
            this._needRebuild = true;
        }
        var comptype = DQX.DocEl.Select(cmpselectlist, myOperator.Tpe);
        comptype.setID(this.getControlID(comp.ID, "Type"));
        comptype.setWidthPx(150);
        comptype.setCssClass('DQXQBQueryboxControl');
        comptype.SetChangeEvent(this._createReactFunctionString('_ReactChangeCompType', comp.ID));
        elem.addElem(comptype);

        elem.addElem(" ");

        myOperator._buildStatement(comp.ID, elem, this);

        var subel = DQX.DocEl.JavaScriptBitmaplinkTransparent("Bitmaps/close.png", "Delete this condition", this._createReactFunctionString('_ReactDel', comp.ID));
        subel.addStyle('position', 'absolute');
        subel.addStyle('left', '-8px');
        subel.addStyle('top', '-12px');
        elem0.addElem(subel);

        if (addor) {
            var subel = DQX.DocEl.JavaScriptBitmaplinkTransparent("Bitmaps/addright.png", "Create an alternative condition (OR)", this._createReactFunctionString('_ReactCreateOr', comp.ID));
            subel.addStyle('position', 'absolute');
            subel.addStyle('right', '-10px');
            subel.addStyle('top', '-14px');
            elem0.addElem(subel);
        }
        if (addand) {
            var subel = DQX.DocEl.JavaScriptBitmaplinkTransparent("Bitmaps/adddown.png", "Create an extra condition (AND)", this._createReactFunctionString('_ReactCreateAnd', comp.ID))
            subel.addStyle('position', 'absolute');
            subel.addStyle('left', (sizex / 2 + 8) + 'px');
            subel.addStyle('bottom', '-16px');
            elem0.addElem(subel);
        }
    }

    this.BuildElement = function (comp, parentcomp, orlevel) {
        var sizex = comp.SizeX;
        comp.myParent = parentcomp;
        this._compid++;
        var mycompid = this._compid;
        var thecomp = DQX.DocEl.Div();
        comp.ID = this._compid;
        compmap[this._compid] = comp;
        thecomp.addAttribute('id', this.getControlID(comp.ID, ''));
        thecomp.addStyle('float', 'left');
        thecomp.setWidthPx(sizex);
        thecomp.setBackgroundColor(this._createBlockColor(orlevel));

        if (comp.IsCompound) {

            if (comp.Tpe == 'AND') {
                thecomp.addStyle('background-image', 'url(Bitmaps/arrowdown.png)');
                thecomp.addStyle('background-position', 'center');
                thecomp.addStyle('background-repeat', 'repeat-y');
                thecomp.addStyle('position', 'relative');
                for (var compnr in comp.Components) {
                    var needspacer = (compnr > 0); // && (compnr < comp.Components.length-1);
                    if (needspacer) {
                        var spacer = DQX.DocEl.Div();
                        spacer.addStyle('float', 'left');
                        spacer.setWidthPx(sizex);
                        spacer.setHeightPx(this.SpacerH1);
                        thecomp.addElem(spacer);
                    }
                    var subcomp = this.BuildElement(comp.Components[compnr], comp, orlevel);
                    thecomp.addElem(subcomp);
                }

                //"add" button
                var subel = DQX.DocEl.JavaScriptBitmaplinkTransparent("Bitmaps/adddown.png", "Create an extra condition (AND)", this._createReactFunctionString('_ReactAddAnd', mycompid));
                subel.addStyle('position', 'absolute');
                subel.addStyle('left', (sizex / 2 + 10) + 'px');
                subel.addStyle('bottom', '-16px');
                thecomp.addElem(subel);


            }


            if (comp.Tpe == 'OR') {
                orlevel++;
                var subsize = (sizex - (comp.Components.length - 1) * DQX.QueryBuilder.BSepX) / comp.Components.length - 2;
                var subcomps = [];
                for (var compnr in comp.Components) {
                    var subcomp = this.BuildElement(comp.Components[compnr], comp, orlevel)
                    subcomps.push(subcomp);
                }

                //start point
                var spacer = DQX.DocEl.Div();
                spacer.addStyle('float', 'left');
                spacer.setWidthPx(sizex);
                spacer.setHeightPx(15);
                spacer.setBackgroundColor('rgb(140,140,140)');
                spacer.addStyle('text-align', 'center');
                spacer.addStyle('position', 'relative');
                spacer.addStyle('border-top-left-radius', '15px');
                spacer.addStyle('border-top-right-radius', '15px');
                spacer.addElem("Alternative paths (OR)")
                var subel = DQX.DocEl.JavaScriptBitmaplinkTransparent("Bitmaps/addright.png", "Add another alternative condition (OR)", this._createReactFunctionString('_ReactAddOr', mycompid));
                subel.addStyle('position', 'absolute');
                subel.addStyle('right', '15px');
                subel.addStyle('top', '-8px');
                spacer.addElem(subel);
                thecomp.addElem(spacer);

                var subcompcontainer = DQX.DocEl.Div();
                subcompcontainer.setBackgroundColor(this._createBlockColor(orlevel));
                subcompcontainer.addStyle('float', 'left');
                subcompcontainer.setCssClass('DQXOrContainer'); //###


                for (compnr in subcomps) {

                    if (compnr > 0) {
                        var spacer = DQX.DocEl.Div();
                        spacer.addStyle('float', 'left');
                        spacer.setHeightPx(3); //###
                        //                        spacer.addStyle('height', '100%');
                        spacer.setWidthPx(this.BSepX);
                        subcompcontainer.addElem(spacer);
                    }



                    var subcompholder = DQX.DocEl.Div();


                    subcompholder.addStyle('float', 'left');
                    subcompholder.addStyle('height', '100%');
                    subcompholder.addStyle('background-image', 'url(Bitmaps/arrowdown.png)');
                    subcompholder.addStyle('background-position', 'center');
                    subcompholder.addStyle('background-repeat', 'repeat-y');
                    subcompholder.addStyle('padding-top', this.SpacerH2 + 'px');
                    subcompholder.addStyle('padding-bottom', this.SpacerH2 + 'px');

                    subcompholder.addElem(subcomps[compnr]);
                    subcompcontainer.addElem(subcompholder);
                }

                thecomp.addElem(subcompcontainer);

                //end point
                var spacer = DQX.DocEl.Div();
                spacer.addStyle('float', 'left');
                spacer.setWidthPx(sizex);
                spacer.setHeightPx(15);
                spacer.setBackgroundColor('rgb(140,140,140)');
                spacer.addStyle('border-bottom-left-radius', '15px');
                spacer.addStyle('border-bottom-right-radius', '15px');
                thecomp.addElem(spacer);

            }


        }
        else
            this._buildStatement(comp, thecomp);

        return thecomp;
    }


    this.Render = function () {
        this._compid = 0;
        compmap = {};
        while (this._cleanUp(this.root));

        var sizex = $('#' + this.myDivID).width() - 30;

        if (sizex <= 1) sizex = 600; //an elementary safety measure to avoid silly things if this is rendered to an invisible component

        this._calcMinSizeX(this.root);
        if (this.root.MinSizeX < sizex) {
            this.root.MinSizeX = sizex;
        }
        sizex = this.root.MinSizeX;
        this._calcSizeX(this.root, this.root.MinSizeX);


        var container = DQX.DocEl.Div();
        container.addStyle('float', 'left');
        container.setWidthPx(sizex);

        var createstartendpoint = function (txt) {
            var spacer = DQX.DocEl.Div();
            spacer.addStyle('position', 'relative');
            spacer.addStyle('float', 'left');
            spacer.addStyle('text-align', 'center');
            spacer.setWidthPx(sizex);
            spacerel = DQX.DocEl.Span({ parent: spacer });
            spacerel.setBackgroundColor(DQX.Color(0.5, 0.5, 0.5));
            spacerel.setColor(DQX.Color(0.9, 0.9, 0.9));
            spacerel.addStyle('border-radius', '18px');
            spacerel.addStyle('text-align', 'center');
            spacerel.addStyle('padding-top', '10px');
            spacerel.addStyle('padding-bottom', '10px');
            spacerel.addStyle('display', 'block');
            spacerel.addStyle('font-weight', 'bold');
            spacerel.addStyle('font-size', '9pt');
            spacerel.addElem(txt);
            spacerel.addStyle('margin-left', 'auto');
            spacerel.addStyle('margin-right', 'auto');
            spacerel.addStyle('position', 'relative');
            spacerel.addStyle('color', 'rgb(200,230,255)');
            spacerel.setHeightPx(16);
            spacerel.setWidthPx(230);
            return spacer;
        }

        {//start point
            var spacer = createstartendpoint('Full data set');
            var addor = this.root.Components.length > 1;
            if (addor) {
                var subel = DQX.DocEl.JavaScriptBitmaplinkTransparent("Bitmaps/addright.png", "Create an alternative condition (OR)", this._createReactFunctionString('_ReactCreateRootOr', -1));
                subel.addStyle('position', 'absolute');
                subel.addStyle('right', '-12px');
                subel.addStyle('top', '5px');
                spacer.getElem(0).addElem(subel);
            }
            container.addElem(spacer);


        }
        {//spacer with arrow
            var spacer = DQX.DocEl.Div();
            spacer.addStyle('background-image', 'url(Bitmaps/arrowdown.png)');
            spacer.addStyle('background-position', 'center');
            spacer.addStyle('background-repeat', 'repeat-y');
            spacer.addStyle('float', 'left');
            spacer.setWidthPx(sizex);
            spacer.setHeightPx(this.SpacerH1);
            container.addElem(spacer);
        }

        container.addElem(this.BuildElement(this.root, null, 0));

        {//spacer with arrow
            var spacer = DQX.DocEl.Div();
            spacer.addStyle('background-image', 'url(Bitmaps/arrowdown.png)');
            spacer.addStyle('background-position', 'center');
            spacer.addStyle('background-repeat', 'repeat-y');
            spacer.addStyle('float', 'left');
            spacer.setWidthPx(sizex);
            spacer.setHeightPx(this.SpacerH1);
            container.addElem(spacer);
        }

        var spacer = createstartendpoint('Filtered data set');
        container.addElem(spacer);

        var rs = container.toString();


        $('#' + this.myDivID).html(rs);

        //Make sure that the columns in each OR block have the same height (so hat the down arrow is shown over the entire stretch)
        $('.DQXOrContainer').each(
            function (idx0, rootel) {
                var maxh = 1;
                $(rootel).children().each(
                    function (idx, el) {
                        maxh = Math.max(maxh, $(el).height());
                    }
                );
                $(rootel).children().each(
                    function (idx, el) {
                        $(el).height(maxh);
                    }
                );
            }
        );

        if ($('#tst01').length > 0) {
        }
        /*
        for (var i=0; i<rs.length; i++) {
        var h = rs[i].height();
        var qq=0;
        }*/

    }

    this._fetchStatementContent = function (comp) {
        if (comp.IsCompound) {
            for (var compnr in comp.Components) {
                this._fetchStatementContent(comp.Components[compnr]);
            }
        }
        else {
            if ("ID" in comp) {
                var mytype = $("#" + this.getControlID(comp.ID, "Type")).val();
                comp.myOperator = DQX.SQL.WhereClause.GetFieldOperatorInfo(mytype).Create();
                comp.myOperator.ColName = $("#" + this.getControlID(comp.ID, "Field")).val();
                comp.myOperator._fetchStatementContent(comp.ID, this);
            }
        }
    }

    this.ReRender = function () {
        this._needRebuild = false;
        this._fetchStatementContent(this.root);
        this.Render();
        if (this._needRebuild) {
            this._fetchStatementContent(this.root);
            this.Render();
        }
    }

    this._extractQueryContent = function (comp) {
        if (comp.IsCompound) {
            var rs = DQX.SQL.WhereClause.Compound(comp.Tpe);
            for (var compnr in comp.Components)
                rs.AddComponent(this._extractQueryContent(comp.Components[compnr]));
            return rs;
        }
        else {
            return comp.myOperator;
        }
    }

    this.GetQuery = function () {
        this._fetchStatementContent(this.root);
        if (this.root.Components.length == 0)
            return DQX.SQL.WhereClause.Trivial();
        return this._extractQueryContent(this.root);
    }
}