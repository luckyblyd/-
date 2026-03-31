import sys
import os
from moviepy import VideoFileClip

def convert_video(input_path):
    print(f"Loading {input_path}...")
    clip = VideoFileClip(input_path)
    
    base_name = os.path.splitext(input_path)[0]
    
    gif_path = base_name + ".gif"
    wav_path = base_name + ".wav"
    static_path = base_name + "_static.jpg"
    
    # Save static frame
    print(f"Extracting static frame to {static_path}...")
    clip.save_frame(static_path, t=0)
    
    print(f"Extracting GIF to {gif_path}..." )
    clip.write_gif(gif_path, fps=15)
    
    print(f"Extracting Audio to {wav_path}...")
    if clip.audio is not None:
        clip.audio.write_audiofile(wav_path)
    else:
        print("No audio found in the video.")
        
    print("Done! Conversion completed gracefully.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        convert_video(sys.argv[1])
    else:
        convert_video("3.mp4")
        convert_video("4.mp4")
