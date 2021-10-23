import defaultExport from "../src/Lancelot.js";

        const game = new Lancelot.Game({
            width: 640,
            height: 360,
            background: "#EFEFEF",
            preload: preload,
            init: init
        });

        function preload() {
            this.loader.AddAudio("test-audio", "audio01.mp3");
            this.loader.AddAudio("test-effect", "audio02.wav");
        }

        function init() {
            const controlsSection = this.CreateSection("controls");
            controlsSection.classList.add("controls-section");
            controlsSection.innerHTML = `
            <div>
                <label>Music</label>
                <br>
                <input id="music-volume" type="range" min="0" step="0.01" max="1" value="1">
            </div>
            <div>
                <label>Effects</label>
                <br>
                <input id="effects-volume" type="range" min="0" step="0.01" max="1" value="1">
            </div>
            `;
            this.ShowSection("controls");
            document.getElementById("music-volume").addEventListener("input", function() {
                game.audio.SetVolume("music", parseFloat(this.value));
            });
            document.getElementById("music-volume").addEventListener("change", function() {
                game.audio.Play("music", "test-audio");
            });
            document.getElementById("effects-volume").addEventListener("input", function() {
                game.audio.SetVolume("effects", parseFloat(this.value));
            });
            document.getElementById("effects-volume").addEventListener("change", function() {
                game.audio.Play("effects" ,"test-effect", {
                    primary: false
                });
            });
        }