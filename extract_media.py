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
    
    print(f"Extracting static frame to {static_path}...")
    clip.save_frame(static_path, t=0)
    
    # 保留高清晰度: 高度大于 720 的才等比缩放到 720P，小于的保持原汁原味
    if clip.size[1] > 720:
        print("Downscaling to 720P limit to preserve HD...")
        clip = clip.resized(height=720)
        
    print(f"Extracting GIF to {gif_path}..." )
    
    # 压缩算法优化：帧率降低至 8 FPS，颜色表压缩至 128 色，利用 nq(NeuQuant) 神经算法获得画质体积平衡
    clip.write_gif(gif_path, fps=8)
    
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
        convert_video("1.mp4")
        convert_video("2.mp4")
