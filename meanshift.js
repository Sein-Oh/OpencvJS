let cnv_for_event = document.getElementById("canvasOutput");
let cnv_pos = cnv_for_event.getBoundingClientRect();
cnv_for_event.addEventListener("mousedown", canvasDown);
cnv_for_event.addEventListener("touchend", canvasDown);


let mouseX = 160;
let mouseY = 120;
function canvasDown(event){
    event.preventDefault();
    trackingState = true;
    mouseX = event.clientX - cnv_pos.left;
    mouseY = event.clientY - cnv_pos.top;
    //document.getElementById("mousePos").innerHTML = "Mouse position : " + mouseX + "," + mouseY;
    onCvSetup();
}


let trackWindow, roi, hsvRoi, mask, lowScalar, highScalar, low, high, roiHist, hsvRoiVec, termCrit, hsv, dst, hsvVec;

function onCvSetup(){
    
    trackWindow = new cv.Rect(mouseX-30, mouseY-30, 60, 60);
    // set up the ROI for tracking
    roi = frame.roi(trackWindow);
    hsvRoi = new cv.Mat();
    cv.cvtColor(roi, hsvRoi, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsvRoi, hsvRoi, cv.COLOR_RGB2HSV);
    mask = new cv.Mat();
    lowScalar = new cv.Scalar(30, 30, 0);
    highScalar = new cv.Scalar(180, 180, 180);
    low = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), lowScalar);
    high = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), highScalar);
    cv.inRange(hsvRoi, low, high, mask);
    roiHist = new cv.Mat();
    hsvRoiVec = new cv.MatVector();
    hsvRoiVec.push_back(hsvRoi);
    cv.calcHist(hsvRoiVec, [0], mask, roiHist, [180], [0, 180]);
    cv.normalize(roiHist, roiHist, 0, 255, cv.NORM_MINMAX);
    
    // delete useless mats.
    roi.delete(); hsvRoi.delete(); mask.delete(); low.delete(); high.delete(); hsvRoiVec.delete();
    
    // Setup the termination criteria, either 10 iteration or move by atleast 1 pt
    termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);
    
    hsv = new cv.Mat(video.height, video.width, cv.CV_8UC3);
    dst = new cv.Mat();
    hsvVec = new cv.MatVector();
    hsvVec.push_back(hsv);
}

let cap, frame;
function onOpenCvReady(){
    document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
    cap = new cv.VideoCapture(video);
    
    // take first frame of the video
    frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    cap.read(frame);
    
    onCvSetup();
    
    function processVideo() {

        // start processing.
        cap.read(frame);
        cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
        cv.calcBackProject(hsvVec, [0], roiHist, dst, [0, 180], 1);
    
        // Apply meanshift to get the new location
        // and it also returns number of iterations meanShift took to converge,
        // which is useless in this demo.
        [, trackWindow] = cv.meanShift(dst, trackWindow, termCrit);

        // Draw it on image
        let [x, y, w, h] = [trackWindow.x, trackWindow.y, trackWindow.width, trackWindow.height];
        cv.rectangle(frame, new cv.Point(x, y), new cv.Point(x+w, y+h), [255, 0, 0, 255], 2);
        cv.imshow('canvasOutput', frame);
    
        // schedule the next one.
        setTimeout(processVideo, 0);
    };
    
    processVideo();
}