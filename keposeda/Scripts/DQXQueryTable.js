


function DQXQueryTableColumn(iName, iCompID, iTablePart) {
    this.myName = iName;
    this.myCompID = iCompID;
    this.TablePart = iTablePart;
    this.Collapsed = false;
    this.HyperlinkCallBack = null;

    this.CellToText = function (content) { return content; }
    this.CellToColor = function (content) { return "white"; }

    this.MakeHyperlink = function (iCallBack) {
        this.HyperlinkCallBack = iCallBack;
    }
}

function DQXTableReflectOwnMessage(ID, message1, message2, message3) {
    return DQXFindTable(ID)._OnOwnMessage(message1,message2, message3);
}


var DQXTableList = [];


//Returns a channelplot by its center canvas id, or return null if not found
function DQXFindTable(iID) {
    for (var i in DQXTableList)
        if (DQXTableList[i].myBaseID == iID)
            return DQXTableList[i];
    return null;
}



function DQXQueryTable(iBaseID, iDataFetcher) {
    DQXTableList.push(this);
    this.myBaseID = iBaseID;
    this.myDataFetcher = iDataFetcher;
    this.myColumns = [];
    this.mySortOptions = [];
    this.myPageSize = 20;
    this.myDataFetcher.Container = this;

    this.myOffset = 0;
    this.TotalRecordCount = -1;//not yet determined

    this.GetElement = function (extension) {
        var id = "#" + this.myBaseID + extension;
        var rs = $(id);
        if (rs.length == 0)
            throw "Missing query table element " + id;
        return rs;
    }

    this.AddColumn = function (iCol) {
        this.myDataFetcher.ColumnActivate(iCol.myCompID);
        this.myColumns.push(iCol);
        return iCol;
    }

    this.FindColumn = function (iColID) {
        for (var colnr in this.myColumns)
            if (this.myColumns[colnr].myCompID == iColID)
                return this.myColumns[colnr];
        return null;
    }

    this.AddSortOption = function (iName, iOption) {//iOption: of type DQXTableSort
        this.mySortOptions.push({ Name: iName, Option: iOption });
        var rs = "";
        for (var optnr in this.mySortOptions) {
            rs += '<option value="'+optnr+'">'+this.mySortOptions[optnr].Name+'</option>';
        }
        this.GetElement('SortOptions').html(rs);
    }

    this.NotifyDataReady = function () {
        this.Render();
    }

    this._OnOwnMessage = function (message1, message2, message3) {
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
    }

    this._OnChangeSort = function () {
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

    this.ReLoad = function () {
        this.TotalRecordCount = -1;//not yet determined
        this.myDataFetcher.ClearData();
        this.myOffset = 0;
        this.Render();
    }


    this.Render = function () {


        var row1 = Math.max(0, this.myOffset - 200);
        var row2 = this.myOffset + this.myPageSize + 200;
        var datacomplete = this.myDataFetcher.IsDataReady(row1, row2);

        this.TotalRecordCount = -1;
        if ('TotalRecordCount' in this.myDataFetcher)
            this.TotalRecordCount = this.myDataFetcher.TotalRecordCount;

        var rs_pager = "";
        rs_pager += '<a onclick=\"DQXTableReflectOwnMessage(\'' + this.myBaseID + '\',\'First\')\" href=\"javascript:void(0)\">First</a>'
        rs_pager += "&nbsp;&nbsp;";
        rs_pager += '<a onclick=\"DQXTableReflectOwnMessage(\'' + this.myBaseID + '\',\'Back\')\" href=\"javascript:void(0)\">Back</a>'
        rs_pager += "&nbsp;&nbsp;";
        rs_pager += '<a onclick=\"DQXTableReflectOwnMessage(\'' + this.myBaseID + '\',\'Forw\')\" href=\"javascript:void(0)\">Forward</a>'
        if (datacomplete) {
            rs_pager += "&nbsp;&nbsp;";
            rs_pager += '<a onclick=\"DQXTableReflectOwnMessage(\'' + this.myBaseID + '\',\'Last\')\" href=\"javascript:void(0)\">Last</a>'
        }
        rs_pager += "&nbsp;&nbsp;Current: ";
        rs_pager += (this.myOffset + 1) + " - " + (this.myOffset + this.myPageSize);

        var rs_table = [];
        for (var tbnr = 0; tbnr <= 1; tbnr++)
            rs_table[tbnr] = '<table class="fixed">';

        //write headers
        for (var colnr in this.myColumns) {
            var thecol = this.myColumns[colnr];
            var tbnr = thecol.TablePart;
            rs_table[tbnr] += "<th>";
            if (!thecol.Collapsed) {
                rs_table[tbnr] += thecol.myName;
                rs_table[tbnr] += '&nbsp;<a onclick=\"DQXTableReflectOwnMessage(\'' + this.myBaseID + '\',\'Collapse\',\'' + thecol.myCompID + '\')\" href=\"javascript:void(0)\"><</a>'
            }
            else
                rs_table[tbnr] += '&nbsp;<a onclick=\"DQXTableReflectOwnMessage(\'' + this.myBaseID + '\',\'Collapse\',\'' + thecol.myCompID + '\')\" href=\"javascript:void(0)\">></a>'
            rs_table[tbnr] += "</th>";
        }


        if (!datacomplete) rs_pager += "&nbsp;FETCHING...";
        else rs_pager += "; Total: " + this.TotalRecordCount;
        if (this.FetchFailed) rs_pager += "&nbsp;FETCH FAILED !!!";

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
                        rs_table[tbnr] += '<a onclick=\"DQXTableReflectOwnMessage(\'' + this.myBaseID + '\',\'Link\',\'' + thecol.myCompID + '\',' + rownr + ')\" href=\"javascript:void(0)\">';
                    rs_table[tbnr] += cell_content;
                    if (thecol.HyperlinkCallBack)
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
    }

    //Initialise some event handlers
    this.GetElement("SortOptions").change($.proxy(this._OnChangeSort, this));
    this.GetElement("SortDir").change($.proxy(this._OnChangeSort, this));

}
