#!/usr/bin/env python3
"""
YouTube 다운로더 테스트 스크립트
"""

from youtube_downloader import YouTubeDownloader

def test_downloader():
    print("🎵 YouTube Downloader 테스트")
    print("=" * 40)
    
    # 다운로더 생성
    downloader = YouTubeDownloader()
    
    # 테스트 URL (짧은 샘플 오디오)
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up
    
    print(f"테스트 URL: {test_url}")
    print("다운로드 시작...")
    
    # 다운로드 실행
    result = downloader.download_audio(test_url, "test_song")
    
    if result:
        print(f"\n✅ 테스트 성공!")
        print(f"파일 위치: {result}")
    else:
        print("\n❌ 테스트 실패")

if __name__ == "__main__":
    test_downloader()