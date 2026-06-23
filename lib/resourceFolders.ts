export const RESOURCE_FOLDERS = [
  "논문 잘 적는법",
  "공지사항 연혁",
  "경진대회",
  "AI & 빅데이터 유튜브",
  "자격증 자료",
  "화석들의 학교생활 꿀팁",
  "완료 프로젝트",
] as const;

export type ResourceFolder = typeof RESOURCE_FOLDERS[number];
