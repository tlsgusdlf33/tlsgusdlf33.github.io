/* Google Play 정책 기준표 (경고용). 49 playrelease/policy.py와 같은 값. 마지막 확인: 2026-10-23 */
(function (root) {
  'use strict';

  var TARGET_SDK = [
    ['2024-08-31', 34],
    ['2025-08-31', 35],
    ['2026-08-31', 36],
  ];

  function requiredTargetSdk(today) {
    var d = (today || new Date()).toISOString().slice(0, 10);
    var req = null;
    TARGET_SDK.forEach(function (r) { if (d >= r[0]) req = r[1]; });
    return req;
  }

  var SENSITIVE = {
    'android.permission.READ_SMS': 'SMS 권한: 기본 문자 앱 등 예외에만 허용, 권한 신고 필요',
    'android.permission.SEND_SMS': 'SMS 권한: 권한 신고 양식 필요',
    'android.permission.RECEIVE_SMS': 'SMS 권한: 권한 신고 양식 필요',
    'android.permission.READ_CALL_LOG': '통화 기록 권한: 권한 신고 양식 필요',
    'android.permission.WRITE_CALL_LOG': '통화 기록 권한: 권한 신고 양식 필요',
    'android.permission.PROCESS_OUTGOING_CALLS': '통화 기록 권한: 권한 신고 양식 필요',
    'android.permission.ACCESS_BACKGROUND_LOCATION': '백그라운드 위치: 위치 권한 신고 + 시연 영상 필요',
    'android.permission.ACCESS_FINE_LOCATION': '정확한 위치: 데이터 보안 양식에 "정확한 위치" 신고',
    'android.permission.ACCESS_COARSE_LOCATION': '대략적 위치: 데이터 보안 양식에 "대략적 위치" 신고',
    'android.permission.QUERY_ALL_PACKAGES': '설치된 앱 전체 조회: 권한 신고 필요, 대부분 거절됨',
    'android.permission.MANAGE_EXTERNAL_STORAGE': '모든 파일 접근: 권한 신고 필요, 대부분 거절됨',
    'android.permission.REQUEST_INSTALL_PACKAGES': '다른 APK 설치: 핵심 기능일 때만 허용, 신고 필요',
    'android.permission.SCHEDULE_EXACT_ALARM': '정확한 알람: 알람·캘린더 앱이 아니면 신고 필요 (비정확 알람 권장)',
    'android.permission.USE_EXACT_ALARM': '정확한 알람(USE_EXACT_ALARM): 알람·캘린더 앱만 허용',
    'android.permission.USE_FULL_SCREEN_INTENT': '전체 화면 알림: 통화·알람 앱이 아니면 신고 필요',
    'android.permission.READ_MEDIA_IMAGES': '사진 접근: 핵심 기능이 아니면 사진 선택 도구(Photo Picker) 사용',
    'android.permission.READ_MEDIA_VIDEO': '동영상 접근: 핵심 기능이 아니면 사진 선택 도구 사용',
    'android.permission.READ_CONTACTS': '연락처: 데이터 보안 양식 신고, 개인정보처리방침에 명시',
    'android.permission.CAMERA': '카메라: 데이터 보안 양식 신고',
    'android.permission.RECORD_AUDIO': '마이크: 데이터 보안 양식 신고',
    'android.permission.BIND_ACCESSIBILITY_SERVICE': '접근성 서비스: 신고 + 시연 영상 필요',
    'android.permission.BIND_VPN_SERVICE': 'VPN 서비스: VpnService 정책 신고 필요',
    'android.permission.READ_PHONE_NUMBERS': '전화번호: 데이터 보안 양식 신고',
    'com.google.android.gms.permission.AD_ID': '광고 ID: Play Console > 앱 콘텐츠 > 광고 ID에서 "사용함" 신고',
  };

  function permissionNote(name) {
    if (SENSITIVE[name]) return SENSITIVE[name];
    var p = 'android.permission.FOREGROUND_SERVICE_';
    if (name.indexOf(p) === 0) return '포그라운드 서비스 유형(' + name.slice(p.length).toLowerCase() + '): 앱 콘텐츠에서 신고 + 영상';
    return null;
  }

  var api = { requiredTargetSdk: requiredTargetSdk, permissionNote: permissionNote };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.PR = root.PR || {})['policy'] = api;
})(typeof self !== 'undefined' ? self : this);
