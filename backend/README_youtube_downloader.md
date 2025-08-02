# YouTube Audio Downloader 🎵

YouTube 동영상에서 오디오를 추출하여 고품질 MP3 파일로 저장하는 Python 스크립트입니다.

## 주요 기능

- ✅ YouTube URL에서 오디오 추출
- ✅ 고품질 MP3 변환 (192kbps)
- ✅ 자동 파일명 생성 또는 커스텀 파일명
- ✅ 비디오 정보 표시 (제목, 업로더, 길이, 조회수)
- ✅ 사용자 친화적 인터페이스
- ✅ 오류 처리 및 검증

## 설치 방법

### 1. 자동 설치 (권장)
```bash
python install_dependencies.py
```

### 2. 수동 설치
```bash
# Python 패키지 설치
pip install -r requirements.txt

# macOS - FFmpeg 설치
brew install ffmpeg

# Ubuntu/Debian - FFmpeg 설치
sudo apt install ffmpeg

# Windows - FFmpeg 다운로드
# https://ffmpeg.org/download.html
```

## 사용 방법

### 대화형 모드
```bash
python youtube_downloader.py
```

### 프로그래밍 방식
```python
from youtube_downloader import YouTubeDownloader

# 다운로더 생성
downloader = YouTubeDownloader(output_dir="my_music")

# 오디오 다운로드
url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
result = downloader.download_audio(url, "my_song")

if result:
    print(f"다운로드 완료: {result}")
```

## 사용 예시

```
🎵 YouTube Audio Downloader
==================================================

옵션:
1. YouTube URL 입력하여 다운로드
2. 종료

선택 (1-2): 1

YouTube URL을 입력하세요: https://www.youtube.com/watch?v=example
커스텀 파일명 (선택사항, Enter로 건너뛰기): my_favorite_song

📋 비디오 정보를 가져오는 중...
📹 제목: Amazing Song Title
👤 업로더: Artist Name
⏱️  길이: 3분 45초
👀 조회수: 1,234,567

🎵 오디오 다운로드 중...
🔄 MP3로 변환 중...
✅ 다운로드 완료: downloads/my_favorite_song.mp3

🎉 다운로드 성공!
📁 파일 위치: downloads/my_favorite_song.mp3
```

## 지원 형식

**입력:**
- YouTube URL (모든 형식)
- YouTube 단축 URL (youtu.be)
- YouTube 임베드 URL

**출력:**
- MP3 (192kbps, 고품질)

## 주요 라이브러리

- **yt-dlp**: YouTube 동영상 다운로드 (youtube-dl의 개선된 버전)
- **pydub**: 오디오 처리 및 형식 변환
- **ffmpeg**: 오디오/비디오 인코딩

## 파일 구조

```
youtube_downloader.py      # 메인 다운로더 스크립트
install_dependencies.py    # 종속성 자동 설치
requirements.txt          # Python 패키지 목록
downloads/               # 다운로드된 파일 저장 폴더
```

## 주의사항

⚠️ **저작권 주의**: 저작권이 있는 콘텐츠를 다운로드할 때는 해당 국가의 법률을 준수하세요.

⚠️ **개인 사용**: 이 도구는 개인적인 용도로만 사용하세요.

## 문제 해결

### FFmpeg 오류
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# https://ffmpeg.org/download.html 에서 다운로드 후 PATH 추가
```

### 권한 오류
```bash
# pip 권한 오류 시
pip install --user yt-dlp pydub
```

### 네트워크 오류
- 인터넷 연결 확인
- VPN 사용 시 비활성화 후 재시도
- 방화벽 설정 확인

## 라이선스

이 프로젝트는 개인적인 사용을 위한 교육 목적으로 제작되었습니다.