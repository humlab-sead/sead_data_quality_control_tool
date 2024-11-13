import Dropzone from "dropzone";
import "dropzone/dist/dropzone.css";
import "../stylesheets/style.scss";
import exceljs from "exceljs";


class SDQC {

    constructor() {
        this.data = {};
        this.initDropzone();

        $(".worksheet-selector").on("change", (evt) => {
            const parent = $(evt.target).closest(".upload-container");
            this.loadTableColumns($(parent).attr("id"), evt.target.value);
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


                let selectedWorksheetName = this.getSelectedWorksheet(uploadSource);
                this.loadTableColumns(uploadSource, selectedWorksheetName, this.data[uploadSource].workbook);

            });
        };

        reader.readAsArrayBuffer(file);
    }

    getSelectedWorksheet(uploadSource) {
        let selectorEl = $("#"+uploadSource+"-container .worksheet-selector");
        let selectedWorksheetName = selectorEl.val();
        let selectedWorksheet = this.data[uploadSource].worksheets.filter((worksheet) => {
            return worksheet.name == selectedWorksheetName;
        })[0];
        return selectedWorksheet;
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

    loadTableColumns(containerName, selectedWorksheetName, worksheet) {
        console.log(containerName,  selectedWorksheetName, worksheet);
        /*
        $("#"+containerName+" table tbody").empty();

        console.log(this.data)
        if(this.data[containerName].dataLoaded == false) {
            this.processExcelWorksheet(containerName, this.data[containerName].worksheet);
            //this.data[containerName].dataLoaded = true;
        }

        console.log(this.data)
        */
    }

}

new SDQC();
