
//Namespace for query tables
DQX.QueryTable = {}

DQX.QueryTable.Column = function (iName, iCompID, iTablePart) {
    var that = {};
    that.myName = iName;
    that.myCompID = iCompID;
    that.myComment = '';
    that.TablePart = iTablePart;
    that.Collapsed = false;
    that.HyperlinkCallBack = null;
    this.HyperLinkTarget = null;

    that.CellToText = function (content) { return content; }
    that.CellToColor = function (content) { return "white"; }

    that.MakeHyperlink = function (iCallBack, iTarget) {
        this.HyperlinkCallBack = iCallBack;
        this.HyperLinkTarget = iTarget;
    }
    return that;
}

DQX.QueryTable._reflectOwnMessage = function(ID, message1, message2, message3) {
    return DQX.QueryTable.FindTable(ID)._OnOwnMessage(message1, message2, message3);
}


DQX.QueryTable._list = [];


//Returns a channelplot by its center canvas id, or return null if not found
DQX.QueryTable.FindTable = function(iID) {
    for (var i in DQX.QueryTable._list)
        if (DQX.QueryTable._list[i].myBaseID == iID)
            return DQX.QueryTable._list[i];
    return null;
}



DQX.QueryTable.Table = function (iBaseID, iDataFetcher) {
    var that = {};
    DQX.QueryTable._list.push(that);
    that.myBaseID = iBaseID;
    that.myDataFetcher = iDataFetcher;
    that.myColumns = [];
    that.mySortOptions = [];
    that.myPageSize = 20;
    that.myDataFetcher.Container = that;

    that.dataValid = false; //false= does not have valid data
    that.myOffset = 0;
    that.TotalRecordCount = -1; //means not yet determined

    that.GetElement = function (extension) {
        var id = "#" + this.myBaseID + extension;
        var rs = $(id);
        if (rs.length == 0)
            throw "Missing query table element " + id;
        return rs;
    }

    that.AddColumn = function (iCol) {
        this.myDataFetcher.ColumnActivate(iCol.myCompID);
        this.myColumns.push(iCol);
        return iCol;
    }

    that.FindColumn = function (iColID) {
        for (var colnr in this.myColumns)
            if (this.myColumns[colnr].myCompID == iColID)
                return this.myColumns[colnr];
        return null;
    }

    that.AddSortOption = function (iName, iOption) {//iOption: of type DQXTableSort
        this.mySortOptions.push({ Name: iName, Option: iOption });
        var rs = "";
        for (var optnr in this.mySortOptions) {
            rs += '<option value="' + optnr + '">' + this.mySortOptions[optnr].Name + '</option>';
        }
        this.GetElement('SortOptions').html(rs);
    }

    that.NotifyDataReady = function () {
        if (this.myDataFetcher.isValid())
            this.dataValid = true;
        this.Render();
    }

    that._OnOwnMessage = function (message1, message2, message3) {
        if (message1 == "First") {
            this.myOffset = 0;
            this.Render();
            return false;
        }
        if (message1 == "Back") {
            this.myOffset -= this.myPageSize;
            if (this.myOffset < 0) this.myOffset = 0;
            this.Render();
            return false;
        }
        if (message1 == "Forw") {
            if (this.myOffset + this.myPageSize < this.TotalRecordCount) {
                this.myOffset += this.myPageSize;
                this.Render();
            }
            return false;
        }
        if (message1 == "Last") {
            this.myOffset = (Math.floor((this.TotalRecordCount) / this.myPageSize)) * this.myPageSize;
            this.Render();
            return false;
        }
        if (message1 == "Collapse") {
            var thecol = this.FindColumn(message2);
            thecol.Collapsed = !thecol.Collapsed;
            this.Render();
            return false;
        }
        if (message1 == "Link") {
            this.FindColumn(message2).HyperlinkCallBack(message3);
        }
        if (message1 == "MoreLines") {
            that.myPageSize += 3;
            this.Render();
            return false;
        }
        if (message1 == "LessLines") {
            that.myPageSize = Math.max(1, that.myPageSize - 3);
            this.Render();
            return false;
        }
    }

    that._OnChangeSort = function () {
        //determine sort option
        var sortoptnr = this.GetElement('SortOptions').val();
        var sortdir = this.GetElement('SortDir').attr('checked');
        var SortOption = this.mySortOptions[sortoptnr].Option;

        this.myDataFetcher.PositionField = SortOption.toString();
        this.myDataFetcher.SortReverse = sortdir;
        this.myDataFetcher.ClearData();

        this.myOffset = 0;
        this.Render();
    }

    that.ReLoad = function () {
        this.TotalRecordCount = -1; //means not yet determined
        this.myDataFetcher.ClearData();
        this.myOffset = 0;
        this.Render();
    }

    that.invalidate = function () {
        if (this.dataValid) {
            this.dataValid = false;
            this.Render();
        }
    }

    that.setQuery = function (iquery) {
        this.myDataFetcher._UserQuery = iquery;
        this.dataValid = true;
    }


    that.Render = function () {


        var row1 = Math.max(0, this.myOffset - 200);
        var row2 = this.myOffset + this.myPageSize + 200;
        var datacomplete = false;

        if (this.dataValid)
            datacomplete = this.myDataFetcher.IsDataReady(row1, row2, true);

        this.TotalRecordCount = -1;
        if ('TotalRecordCount' in this.myDataFetcher)
            this.TotalRecordCount = this.myDataFetcher.TotalRecordCount;

        var rs_pager = "";
        var rs_footer = '';
        rs_pager += '<span style="position:relative;bottom:-8px;">';
        rs_pager += DQX.DocEl.JavaScriptBitmaplink("Bitmaps/first.png", "First page", "DQX.QueryTable._reflectOwnMessage('" + this.myBaseID + "','First')");
        rs_pager += DQX.DocEl.JavaScriptBitmaplink("Bitmaps/previous.png", "Previous page", "DQX.QueryTable._reflectOwnMessage('" + this.myBaseID + "','Back')");
        rs_pager += DQX.DocEl.JavaScriptBitmaplink('Bitmaps/next.png', "Next page", "DQX.QueryTable._reflectOwnMessage('" + this.myBaseID + "','Forw')");
        if (datacomplete) {
            rs_pager += DQX.DocEl.JavaScriptBitmaplink('Bitmaps/lastpage.png', "Last page", "DQX.QueryTable._reflectOwnMessage('" + this.myBaseID + "','Last')");
        }
        rs_pager += "</span>";
        if (datacomplete && this.dataValid) {
            var downloadlink = this.myDataFetcher.CreateDownloadUrl();
            rs_footer += "<a href=" + downloadlink + ">Download as TAB-delimited file</a>";
        }
        else {
            rs_footer += "&nbsp;";
        }

        rs_pager += "&nbsp;&nbsp;";
        rs_pager += DQX.DocEl.JavaScriptBitmaplinkTransparent('Bitmaps/morelines.png', "More lines on page", "DQX.QueryTable._reflectOwnMessage('" + this.myBaseID + "','MoreLines')");
        rs_pager += "&nbsp;";
        rs_pager += DQX.DocEl.JavaScriptBitmaplinkTransparent('Bitmaps/lesslines.png', "Less lines on page", "DQX.QueryTable._reflectOwnMessage('" + this.myBaseID + "','LessLines')");

        rs_pager += "&nbsp;&nbsp;&nbsp;Current: ";
        rs_pager += (this.myOffset + 1) + "-" + (this.myOffset + this.myPageSize);

        var rs_table = [];
        for (var tbnr = 0; tbnr <= 1; tbnr++)
            if (this.dataValid)
                rs_table[tbnr] = '<table class="DQXQueryTable">';
            else
                rs_table[tbnr] = '<table class="DQXQueryTable DQXQueryTableInvalid">';

        //write headers
        for (var colnr in this.myColumns) {
            var thecol = this.myColumns[colnr];
            var tbnr = thecol.TablePart;
            rs_table[tbnr] += '<th TITLE="{comment}">'.DQXformat({comment:thecol.myComment});
            if (!thecol.Collapsed) {
                rs_table[tbnr] += thecol.myName;
                rs_table[tbnr] += '&nbsp;<a onclick=\"DQX.QueryTable._reflectOwnMessage(\'' + this.myBaseID + '\',\'Collapse\',\'' + thecol.myCompID + '\')\" href=\"javascript:void(0)\"><</a>'
            }
            else
                rs_table[tbnr] += '&nbsp;<a onclick=\"DQX.QueryTable._reflectOwnMessage(\'' + this.myBaseID + '\',\'Collapse\',\'' + thecol.myCompID + '\')\" href=\"javascript:void(0)\">></a>'
            rs_table[tbnr] += "</th>";
        }


        if ((this.dataValid) && (!datacomplete)) rs_pager += '&nbsp;<span style="background-color:rgb(192,0,0);font-weight:bold">FETCHING...</span>';
        else rs_pager += "; Total: " + Math.max(0, this.TotalRecordCount);
        if (this.FetchFailed) rs_pager += "&nbsp;FETCH FAILED !";

        for (var rownr0 = 0; rownr0 < this.myPageSize; rownr0++) {
            var rownr = this.myOffset + rownr0;
            /*if (rownr < this.TotalRecordCount)*/
            {
                var downloadrownr = this.myDataFetcher.FindIndexByXVal(rownr);
                for (var tbnr = 0; tbnr <= 1; tbnr++)
                    rs_table[tbnr] += "<tr>";
                for (var colnr in this.myColumns) {
                    var thecol = this.myColumns[colnr];
                    var tbnr = thecol.TablePart;
                    var hascontent = false;
                    var cell_color = "white";
                    var cell_content = "&nbsp;";
                    if ((this.TotalRecordCount < 0) || (rownr < this.TotalRecordCount)) cell_content = "?";
                    if (downloadrownr >= 0) {
                        hascontent = true;
                        cell_content = this.myDataFetcher.GetColumnPoint(downloadrownr, thecol.myCompID);
                        cell_color = thecol.CellToColor(cell_content);
                        cell_content = thecol.CellToText(cell_content);
                        var cell_title = thecol.myName + ": " + cell_content;
                        if (thecol.Collapsed)
                            cell_content = "";
                    }
                    rs_table[tbnr] += "<td  TITLE='" + cell_title + "' style='background-color:" + cell_color + "'>";
                    if ((thecol.HyperlinkCallBack) && (hascontent))
                        rs_table[tbnr] += '<a class="DQXQueryTableLink" onclick=\"DQX.QueryTable._reflectOwnMessage(\'' + this.myBaseID + '\',\'Link\',\'' + thecol.myCompID + '\',' + rownr + ')\" href=' + thecol.HyperLinkTarget + '>';
                    rs_table[tbnr] += cell_content;
                    if ((thecol.HyperlinkCallBack) && (hascontent))
                        rs_table[tbnr] += '</a>';
                    rs_table[tbnr] += "</td>";
                }
            }
            for (var tbnr = 0; tbnr <= 1; tbnr++)
                rs_table[tbnr] += "</tr>";
        }
        for (var tbnr = 0; tbnr <= 1; tbnr++)
            rs_table[tbnr] += "</table>";

        this.GetElement('Body1').html(rs_table[0]);
        this.GetElement('Body2').html(rs_table[1]);
        this.GetElement('Pager').html(rs_pager);
        this.GetElement('Footer').html(rs_footer);
    }

    //Initialise some event handlers
    that.GetElement("SortOptions").change($.proxy(that._OnChangeSort, that));
    that.GetElement("SortDir").change($.proxy(that._OnChangeSort, that));

    return that;
}
