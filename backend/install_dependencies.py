#!/usr/bin/env python3
"""
YouTube Downloader 종속성 설치 스크립트
"""

import subprocess
import sys
import os

def install_package(package):
    """패키지 설치"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError:
        return False

def check_ffmpeg():
    """FFmpeg 설치 확인"""
    try:
        subprocess.run(["ffmpeg", "-version"], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL, 
                      check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def main():
    print("🔧 YouTube Downloader 설치 시작")
    print("=" * 50)
    
    # 필수 패키지 목록
    packages = [
        "yt-dlp>=2023.12.30",
        "pydub>=0.25.1"
    ]
    
    # 패키지 설치
    for package in packages:
        print(f"📦 {package} 설치 중...")
        if install_package(package):
            print(f"✅ {package} 설치 완료")
        else:
            print(f"❌ {package} 설치 실패")
            return False
    
    # FFmpeg 확인
    print("\n🎬 FFmpeg 확인 중...")
    if check_ffmpeg():
        print("✅ FFmpeg가 설치되어 있습니다.")
    else:
        print("❌ FFmpeg가 설치되지 않았습니다.")
        print("\nFFmpeg 설치 방법:")
        
        if sys.platform == "darwin":  # macOS
            print("macOS: brew install ffmpeg")
        elif sys.platform == "linux":  # Linux
            print("Ubuntu/Debian: sudo apt install ffmpeg")
            print("CentOS/RHEL: sudo yum install ffmpeg")
        elif sys.platform == "win32":  # Windows
            print("Windows: https://ffmpeg.org/download.html 에서 다운로드")
        
        print("\nFFmpeg 설치 후 다시 실행해주세요.")
        return False
    
    print("\n🎉 모든 종속성 설치 완료!")
    print("이제 'python youtube_downloader.py'로 실행할 수 있습니다.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)