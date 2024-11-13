import Dropzone from "dropzone";
import "dropzone/dist/dropzone.css";
import "../stylesheets/style.scss";
import exceljs from "exceljs";
import { nanoid } from "nanoid";

class SDQC {

    constructor() {
        this.data = {};
        this.initDropzone();

        $(".worksheet-selector").on("change", (evt) => {
            const parent = $(evt.target).closest(".upload-container");
            const worksheetName = evt.target.value;

            let containerName =parent.attr("id").replace("-container", "");
            let workbook = this.data[containerName].workbook;
            
            this.loadTableColumns(containerName, worksheetName, workbook);
        });
        
        this.autoLoadExampleData();
    }

    autoLoadExampleData() {
        let sourceFileName = "lund_dendro_dataset_20200630_AH_corrections.xlsx";
        fetch("/data/"+sourceFileName)
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], sourceFileName);
                this.loadExcel("source-data-upload", file);
            });

            
        let exportFileName = "sead_datasets_export (10).xlsx";
        fetch("/data/"+exportFileName)
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], exportFileName);
                this.loadExcel("sead-export-upload", file);
            });
            
    }

    initDropzone() {
        this.sourceDropzone = new Dropzone("div#source-data-upload", {
            url: "/dummy-url",  // No upload URL needed
            maxFilesize: 100,  // MB
            autoProcessQueue: false,  // Prevent automatic upload
            acceptedFiles: ".xlsx,.xls",  // Only accept Excel files
            init: () => {
            }
        });
        this.sourceDropzone.on("addedfile", (file) => {
            this.loadExcel("source-data-upload", file);
        });

        this.exportDropzone = new Dropzone("div#sead-export-upload", {
            url: "/dummy-url",  // No upload URL needed
            maxFilesize: 100,  // MB
            autoProcessQueue: false,  // Prevent automatic upload
            acceptedFiles: ".xlsx,.xls",  // Only accept Excel files
            init: () => {
            }
        });
        this.exportDropzone.on("addedfile", (file) => {
            this.loadExcel("sead-export-upload", file);
        });
    }

    loadExcel(uploadSource, file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = new exceljs.Workbook();
            
            workbook.xlsx.load(data).then((workbook) => {

                let selectorEl = $("#"+uploadSource+"-container .worksheet-selector");
                selectorEl.empty();

                this.data[uploadSource] = {
                    workbook: workbook
                };

                //for each worksheet...
                workbook.eachSheet((worksheet, sheetId) => {
                    /*
                    this.data[uploadSource].worksheets.push({
                        name: worksheet.name,
                        worksheet: worksheet,
                        dataLoaded: false,
                        headers: [],
                        rows: []
                    });
                    */
                    selectorEl.append(
                        $("<option>").text(worksheet.name)
                    );

                    $("#"+uploadSource+"-container .worksheet-selector-container").css("visibility", "visible");
                
                    
                });

                if(uploadSource == "source-data-upload") {
                    this.autoSelectDefaultWorksheet(selectorEl);
                }


                let selectedWorksheetName = this.getSelectedWorksheetName(uploadSource);
                this.loadTableColumns(uploadSource, selectedWorksheetName, this.data[uploadSource].workbook);
            });
        };

        reader.readAsArrayBuffer(file);
    }

    getSelectedWorksheetName(uploadSource) {
        let selectorEl = $("#"+uploadSource+"-container .worksheet-selector");
        let selectedWorksheetName = selectorEl.val();
        return selectedWorksheetName;
    }

    processExcelWorksheet(containerName, worksheet) {
        // Extract header row from the worksheet
        let headers = [];
        let rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                // Extract header cells
                headers = row.values.filter(Boolean); // Remove undefined values
            } else {
                // Convert each row to a key-value pair object
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    rowData[headers[colNumber - 1]] = cell.value;
                });
                rows.push(rowData);
            }
        });

        this.data[containerName].headers = headers;
        this.data[containerName].rows = rows;
        this.data[containerName].dataLoaded = true;

        console.log(this.data);
        
        //console.log(rows);

        
    }

    autoSelectDefaultWorksheet(selectorEl) {
        //try to find an option that is NOT "References" or "SEAD metadata"
        let defaultOption = selectorEl.find("option").filter((i, el) => {
            return el.text != "References" && el.text != "SEAD metadata";
        });

        //now select it
        defaultOption.prop("selected", true);
    }

    loadTableColumns(containerName, selectedWorksheetName, workbook) {
        const worksheet = workbook.getWorksheet(selectedWorksheetName);

        let tableSelector = "";
        if(containerName == "source-data-upload") {
            tableSelector = "#source-columns-table";
        }
        else if(containerName == "sead-export-upload") {
            tableSelector = "#sead-columns-table";
        }

        $(tableSelector+" tbody").empty();

        //populate the table with the selected worksheet's header data
        let headers = [];
        let rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                // Extract header cells
                headers = row.values.filter(Boolean); // Remove undefined values
            } else {
                // Convert each row to a key-value pair object
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    rowData[headers[colNumber - 1]] = cell.value;
                });
                rows.push(rowData);
            }
        });

        this.data[containerName].headers = headers;
        this.data[containerName].rows = rows;

        let rowIds = [];
        headers.forEach(headerName => {
            let rowId = nanoid();
            $(tableSelector+" tbody").append(`<tr>
                <td id='`+rowId+`' class='column-cell'>`+headerName+`</td>
                </tr>`);
            rowIds.push(rowId);
        });

        //select 2 random rowIds
        /*
        let startRowId = rowIds[Math.floor(Math.random() * rowIds.length)];
        let endRowId = rowIds[Math.floor(Math.random() * rowIds.length)];

        $("#"+startRowId).css("background-color", "yellow");
        $("#"+endRowId).css("background-color", "yellow");
        */
        /*
        setTimeout(() => {
            jsPlumb.jsPlumb.connect({
                source: startRowId,
                target: endRowId,
                connector: ["Bezier", { curviness: 50 }],
                anchors: ["Left", "Right"],
                paintStyle: { stroke: "blue", strokeWidth: 2 },
                endpoint: "Dot",
            });
        }, 3000);
        */


        $(tableSelector+" .column-cell").on("click", (evt) => {
            let cell = $(evt.target);
            let cellId = cell.attr("id");

            if(cell.hasClass("selected")) {
                cell.removeClass("selected");
            }
            else {
                cell.addClass("selected");
            }

            let selectedCells = $(".column-cell.selected");
            if(selectedCells.length == 2) {
                let startRowId = selectedCells[0].id;
                let endRowId = selectedCells[1].id;

                /*
                jsPlumb.jsPlumb.connect({
                    source: startRowId,
                    target: endRowId,
                    connector: ["Bezier", { curviness: 50 }],
                    anchors: ["Right", "Left"],
                    paintStyle: { stroke: "blue", strokeWidth: 2 },
                    endpoint: "Dot",
                });
                */

                selectedCells.removeClass("selected");
            }
        });
    }

    getWorksheet(worksheetName, workbook) {
        return workbook.getWorksheet(worksheetName);
    }

}

new SDQC();
