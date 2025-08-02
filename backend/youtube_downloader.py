#!/usr/bin/env python3
"""
YouTube Audio Downloader
유튜브 URL을 입력받아 오디오를 MP3 파일로 다운로드하는 스크립트
"""

import os
import sys
import re
import warnings
from pathlib import Path

# pydub의 정규식 경고 무시
warnings.filterwarnings("ignore", category=SyntaxWarning, module="pydub")

try:
    import yt_dlp
    # pydub 대신 직접 yt-dlp의 오디오 변환 사용
    from mutagen.mp3 import MP3
    from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC
except ImportError as e:
    print(f"필수 라이브러리가 설치되지 않았습니다: {e}")
    print("다음 명령어로 설치하세요:")
    print("pip install yt-dlp mutagen")
    sys.exit(1)

class YouTubeDownloader:
    def __init__(self, output_dir="downloads"):
        """
        YouTube 다운로더 초기화
        
        Args:
            output_dir (str): 다운로드된 파일을 저장할 디렉토리
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # yt-dlp 설정
        self.ydl_opts = {
            'format': 'bestaudio/best',  # 최고 품질 오디오
            'outtmpl': str(self.output_dir / '%(title)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'noplaylist': True,  # 플레이리스트가 아닌 단일 비디오만
            'ignoreerrors': True,
            'no_warnings': False,
        }
    
    def is_valid_youtube_url(self, url):
        """
        유효한 YouTube URL인지 확인
        
        Args:
            url (str): 검증할 URL
            
        Returns:
            bool: 유효한 YouTube URL이면 True
        """
        youtube_regex = re.compile(
            r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
            r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
        )
        return youtube_regex.match(url) is not None
    
    def get_video_info(self, url):
        """
        비디오 정보 가져오기
        
        Args:
            url (str): YouTube URL
            
        Returns:
            dict: 비디오 정보
        """
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                return {
                    'title': info.get('title', 'Unknown'),
                    'uploader': info.get('uploader', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'view_count': info.get('view_count', 0),
                }
        except Exception as e:
            print(f"비디오 정보를 가져올 수 없습니다: {e}")
            return None
    
    def download_audio(self, url, output_filename=None):
        """
        YouTube 비디오에서 오디오를 추출하여 MP3로 저장
        
        Args:
            url (str): YouTube URL
            output_filename (str, optional): 출력 파일명 (확장자 제외)
            
        Returns:
            str: 다운로드된 파일 경로 또는 None
        """
        if not self.is_valid_youtube_url(url):
            print("❌ 유효하지 않은 YouTube URL입니다.")
            return None
        
        # 비디오 정보 가져오기
        print("📋 비디오 정보를 가져오는 중...")
        info = self.get_video_info(url)
        if not info:
            return None
        
        # 메타데이터 추가를 위해 정보 저장
        self.current_video_info = info
        
        print(f"📹 제목: {info['title']}")
        print(f"👤 업로더: {info['uploader']}")
        print(f"⏱️  길이: {info['duration']//60}분 {info['duration']%60}초")
        print(f"👀 조회수: {info['view_count']:,}")
        
        # 출력 파일명 설정
        if output_filename:
            # 파일명에서 특수문자 제거
            safe_filename = re.sub(r'[<>:"/\\|?*]', '', output_filename)
            self.ydl_opts['outtmpl'] = str(self.output_dir / f'{safe_filename}.%(ext)s')
        
        try:
            print("\n🎵 오디오 다운로드 중...")
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                ydl.download([url])
            
            # 다운로드된 MP3 파일 찾기
            downloaded_files = list(self.output_dir.glob("*.mp3"))
            
            if not downloaded_files:
                print("❌ 다운로드된 파일을 찾을 수 없습니다.")
                return None
            
            # 가장 최근 파일 선택
            latest_file = max(downloaded_files, key=os.path.getctime)
            
            # 파일명 변경 (필요한 경우)
            if output_filename:
                safe_filename = re.sub(r'[<>:"/\\|?*]', '', output_filename)
                new_path = self.output_dir / f"{safe_filename}.mp3"
                latest_file.rename(new_path)
                latest_file = new_path
            
            # 메타데이터 추가
            if hasattr(self, 'current_video_info'):
                self.add_metadata(latest_file, self.current_video_info)
            
            print(f"✅ 다운로드 완료: {latest_file}")
            return str(latest_file)
            
        except Exception as e:
            print(f"❌ 다운로드 실패: {e}")
            return None
    
    
    def add_metadata(self, mp3_path, video_info=None):
        """
        MP3 파일에 메타데이터 추가
        
        Args:
            mp3_path (Path): MP3 파일 경로
            video_info (dict, optional): 비디오 정보
        """
        try:
            audio_file = MP3(str(mp3_path), ID3=ID3)
            
            # ID3 태그가 없으면 추가
            if audio_file.tags is None:
                audio_file.add_tags()
            
            if video_info:
                # 제목
                if video_info.get('title'):
                    audio_file.tags.add(TIT2(encoding=3, text=video_info['title']))
                
                # 아티스트
                if video_info.get('uploader'):
                    audio_file.tags.add(TPE1(encoding=3, text=video_info['uploader']))
                
                # 앨범 (채널명 사용)
                if video_info.get('uploader'):
                    audio_file.tags.add(TALB(encoding=3, text=f"YouTube - {video_info['uploader']}"))
            
            audio_file.save()
            
        except Exception as e:
            print(f"⚠️ 메타데이터 추가 실패: {e}")

def main():
    """메인 함수"""
    print("🎵 YouTube Audio Downloader")
    print("=" * 50)
    
    downloader = YouTubeDownloader()
    
    while True:
        print("\n옵션:")
        print("1. YouTube URL 입력하여 다운로드")
        print("2. 종료")
        
        choice = input("\n선택 (1-2): ").strip()
        
        if choice == '1':
            url = input("\nYouTube URL을 입력하세요: ").strip()
            if not url:
                print("❌ URL을 입력해주세요.")
                continue
            
            # 커스텀 파일명 옵션
            custom_name = input("커스텀 파일명 (선택사항, Enter로 건너뛰기): ").strip()
            custom_name = custom_name if custom_name else None
            
            # 다운로드 실행
            result = downloader.download_audio(url, custom_name)
            
            if result:
                print(f"\n🎉 다운로드 성공!")
                print(f"📁 파일 위치: {result}")
            else:
                print("\n❌ 다운로드 실패")
                
        elif choice == '2':
            print("👋 프로그램을 종료합니다.")
            break
        else:
            print("❌ 잘못된 선택입니다.")

if __name__ == "__main__":
    main()