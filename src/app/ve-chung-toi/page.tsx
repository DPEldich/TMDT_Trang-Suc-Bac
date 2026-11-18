import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Container } from '../../components/UI/Container';
import { TEAM_MEMBERS } from '../../data/team';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Về chúng tôi | NFA Jewelry',
  description:
    'Giới thiệu dự án trang sức bạc NFA và danh sách thành viên thực hiện đồ án môn học Thương mại điện tử.',
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <Container>
          <nav className={styles.breadcrumbs} aria-label="Đường dẫn điều hướng">
            <Link href="/" className={styles.crumbLink}>
              Trang chủ
            </Link>
            <span className={styles.crumbSeparator}>/</span>
            <span className={styles.crumbCurrent}>Về chúng tôi</span>
          </nav>

          <h1 className={styles.pageTitle}>Về chúng tôi</h1>
          <p className={styles.pageDescription}>
            NFA là dự án cửa hàng trực tuyến phục vụ đồ án môn học Thương mại điện tử. Trang web giới thiệu các mẫu trang sức bạc với hình ảnh chụp thực tế và quy trình đặt hàng qua biểu mẫu.
          </p>
        </Container>
      </div>

      <Container className={styles.contentContainer}>
        {/* 8 Team Members Section - Strict order, exact spelling and MSSV */}
        <section className={styles.teamSection} aria-labelledby="team-heading">
          <div className={styles.sectionHeader}>
            <div className={styles.teamBadgeRow}>
              <Users className={styles.teamIcon} aria-hidden="true" />
              <span className={styles.sectionSubtitle}>Thành viên</span>
            </div>
            <h2 id="team-heading" className={styles.sectionTitle}>
              Danh sách thành viên nhóm
            </h2>
            <p className={styles.teamIntro}>
              Danh sách thành viên thực hiện dự án:
            </p>
          </div>

          <div className={styles.membersGrid}>
            {TEAM_MEMBERS.map((member) => (
              <article key={member.studentId} className={styles.memberCard}>
                <div className={styles.memberOrder}>{String(member.order).padStart(2, '0')}</div>
                <div className={styles.memberDetails}>
                  <h3 className={styles.memberName}>{member.fullName}</h3>
                  <div className={styles.memberMeta}>
                    <span className={styles.mssvBadge}>MSSV: {member.studentId}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
