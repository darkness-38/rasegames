const _fb = {
    _k: 'QUl6YVN5QmlnUksxUVYxbk8tcVRtTU1MVWNuQ3RYdFcwZV9zWG5R',
    _d: 'cmFzZWdhbWVzLTk5MzRm',
    _r: 'ZXVyb3BlLXdlc3Qx'
};

const _d = (s) => atob(s);

function getFirebaseConfig() {
    return {
        apiKey: _d(_fb._k),
        authDomain: `${_d(_fb._d)}.firebaseapp.com`,
        databaseURL: `https://${_d(_fb._d)}-default-rtdb.${_d(_fb._r)}.firebasedatabase.app`,
        projectId: _d(_fb._d),
        storageBucket: `${_d(_fb._d)}.firebasestorage.app`,
        messagingSenderId: "762399445136",
        appId: "1:762399445136:web:7dea2f9064963fc03dc815"
    };
}

window.getFirebaseConfig = getFirebaseConfig;
