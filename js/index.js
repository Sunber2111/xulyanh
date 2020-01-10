const imgElement = document.getElementById("imageSrc");
const inputElement = document.getElementById('fileInput');
const rangeBar = document.getElementById('formControlRange');
const rangeBar1 = document.getElementById('formControlRange1');
let arr = {}; // object lưu tần suất của cường độ điểm ảnh
let h = {}; //   object lưu giá trị hàm chi phí H(i)

// Giảm Sáng
rangeBar1.addEventListener('change', (e) => {

    let value = Number(e.target.value);
    if (imgElement.src !== '') {
        let src = cv.imread('imageSrc');

        let dst = new cv.Mat();

        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

        console.log(dst.ucharPtr(dst.rows - 1, dst.cols - 1)[0]);
        for (let row = 0; row < dst.rows; row++) {
            for (let col = 0; col < dst.cols; col++) {
                if (dst.ucharPtr(row, col)[0] - value > 0)
                    dst.ucharPtr(row, col)[0] = dst.ucharPtr(row, col)[0] - value;
                else
                    dst.ucharPtr(row, col)[0] = 0;
            }
        }

        cv.imshow('imageGS', dst);
        console.log(dst.ucharPtr(dst.rows - 1, dst.cols - 1)[0]);

    }
    document.getElementById('numrange1').innerHTML = 'Cường Độ ' + value;

}, false);

// Tăng Sáng
rangeBar.addEventListener('change', (e) => {

    let value = Number(e.target.value);
    if (imgElement.src !== '') {

        let src = cv.imread('imageSrc');

        let dst = new cv.Mat();

        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

        console.log(dst.ucharPtr(dst.rows - 1, dst.cols - 1)[0]);
        for (let row = 0; row < dst.rows; row++) {
            for (let col = 0; col < dst.cols; col++) {
                if (dst.ucharPtr(row, col)[0] + value < 255)
                    dst.ucharPtr(row, col)[0] = dst.ucharPtr(row, col)[0] + value;
                else
                    dst.ucharPtr(row, col)[0] = 255;
            }
        }

        cv.imshow('imageTS', dst);
        console.log(dst.ucharPtr(dst.rows - 1, dst.cols - 1)[0]);

    }
    document.getElementById('numrange').innerHTML = 'Cường Độ ' + value;

}, false);

// Load ảnh gốc
inputElement.addEventListener('change', (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);

}, false);


imgElement.onload = function () {

    let src = cv.imread('imageSrc');
    let sum = 0, n = 0, Midle = 0;
    let test = new cv.Mat(src.size(), 0);
    let dst = new cv.Mat(src.size(), 0);
    let dst1 = new cv.Mat();
    let histogram = new cv.Mat(src.size(), 0);
    let anhAmBan = new cv.Mat(src.size(), 0);
    let histogramCV = new cv.Mat(src.size(), 0);
    let anhXamA = new cv.Mat(src.size(), 0);

    // Khởi Tạo Mảng Lưu Gía Trị 0 -> 255
    for (let index = 0; index < 256; index++) {
        arr[index] = 0;
        h[index] = 0;
    }

    //          input  output    tên hàm chuyển
    cv.cvtColor(src,   dst,      cv.COLOR_RGBA2GRAY); // -> dùng thư viện chuyển hình màu sang xám


    for (let row = 0; row < src.rows; row++) {
        for (let col = 0; col < src.cols; col++) {

            n++;

            Midle = Math.round((src.ucharPtr(row, col)[0] + src.ucharPtr(row, col)[1] + src.ucharPtr(row, col)[2]) / 3);

            // có trọng số R: 0.299    G:0.587   B:0.114
            anhXamA.ucharPtr(row, col)[0] = 
                Math.round((src.ucharPtr(row, col)[0]*0.299 + src.ucharPtr(row, col)[1]*0.587 + src.ucharPtr(row, col)[2]*0.114 ));

            test.ucharPtr(row, col)[0] = Midle;

            anhAmBan.ucharPtr(row, col)[0] = 255 - Midle;

            arr[Midle] += 1;

            sum += (100 - (Math.abs((dst.ucharPtr(row, col)[0] - Midle)) * 100 / 255));
        }
    }
    
    //           input    output   ngưỡng   maxvalue   tên hàm chuyển
    cv.threshold(test,    dst1,    140,      255,       cv.THRESH_BINARY); // -> dùng thư viện chuyển hình xám sang BW

    document.getElementById('status').innerHTML = (sum / n).toFixed(2).toString() + '%';

    cv.imshow('imageGray', test);

    h[0] = arr[0];

    // Tính Hàm chi phí H(i)
    for (let i = 1; i <= 255; i++) {
        h[i] = h[i - 1] + arr[i];
    }

    let minHi = h['0'], maxHi = h['255'];

    let d = maxHi - minHi;


    // Tính K(i)
    for (let row = 0; row < src.rows; row++) {
        for (let col = 0; col < src.cols; col++) {

            histogram.ucharPtr(row, col)[0] = Math.round(((h[test.ucharPtr(row, col)[0]] - minHi) / d) * 255);

        }
    }

    // ảnh âm bản tạo từ thư viện opencv
    const imgnot = new cv.Mat();

    //             input   output
    cv.bitwise_not(test,    imgnot);  // chuyển đỗi xám sang âm bản
    
    //              input   output
    cv.equalizeHist(test,    histogramCV); // chuyển đổi xám sang histogram

    sum = 0;

    n = 0;

    for (let row = 0; row < src.rows; row++) {
        for (let col = 0; col < src.cols; col++) {

            if (test.ucharPtr(row, col)[0] > 140) {

                test.ucharPtr(row, col)[0] = 255;

            }
            else {

                test.ucharPtr(row, col)[0] = 0;
                
            }

        }
    }

    document.getElementById('statusA').innerHTML = calculator(dst, anhXamA) + '%';

    document.getElementById('status2').innerHTML = calculator(anhAmBan, imgnot) + '%';

    document.getElementById('status1').innerHTML = calculatorBW(test,dst1) + '%';

    document.getElementById('statusHE').innerHTML = calculator(histogramCV, histogram) + '%';


    cv.imshow('imageAbCV', imgnot);

    cv.imshow('imageGrayAnpha', anhXamA);

    cv.imshow('imageHE', histogram);

    cv.imshow('imageAb', anhAmBan);

    cv.imshow('imageTS', dst);

    cv.imshow('imageGS', dst);

    cv.imshow('imageBw', test);

    cv.imshow('imageHECV', histogramCV);

    cv.imshow('imageGrayCV', dst);

    cv.imshow('imageGrayCV1', dst);

    cv.imshow('imageBwCV', dst1);

    src.delete();

    dst.delete();
}


//Hàm Tính Độ khác biệt giữa hai bức ảnh xám 
calculator = (src, dst) => {

    let n = src.rows * src.cols, sum = 0;

    for (let row = 0; row < src.rows; row++) {
        for (let col = 0; col < src.cols; col++) {

            sum += (100 - (Math.abs((dst.ucharPtr(row, col)[0] - src.ucharPtr(row, col)[0])) * 100 / 255));
        }
    }

    return (sum / n).toFixed(2);
}

//Hàm Tính Độ khác biệt giữa hai bức ảnh BW
calculatorBW = (src, dst) => {

    let n = src.rows * src.cols, sum = 0;

    for (let row = 0; row < src.rows; row++) {
        for (let col = 0; col < src.cols; col++) {
            if(src.ucharPtr(row,col)[0]===dst.ucharPtr(row,col)[0])
            sum++;
        }
    }

    return (sum *100 / n).toFixed(2);
}