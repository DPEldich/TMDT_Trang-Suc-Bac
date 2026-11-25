import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '../../components/UI/Container';
import { TEAM_MEMBERS } from '../../data/team';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Về chúng tôi | NFA',
  description:
    'Giới thiệu dự án cửa hàng trang sức NFA và danh sách 8 thành viên sinh viên thực hiện đồ án môn học Thương mại điện tử.',
};

export default function AboutPage() {
  return (
    <main id="main-content" className={styles.main}>
      <div className={styles.pageHeader}>
        <Container>
          <nav className={styles.breadcrumbs} aria-label="Đường dẫn điều hướng">
            <Link href="/" className={styles.crumbLink}>
              Trang chủ
            </Link>
            <span className={styles.crumbSeparator} aria-hidden="true">
              /
            </span>
            <span className={styles.crumbCurrent} aria-current="page">
              Về chúng tôi
            </span>
          </nav>

          <h1 className={styles.pageTitle}>Về NFA</h1>
          <p className={styles.pageDescription}>
            Dự án trang sức NFA của nhóm sinh viên môn Thương mại điện tử.
          </p>
        </Container>
      </div>

      <Container className={styles.contentContainer}>
        {/* 8 Team Members Section — Strict order, exact Vietnamese spelling and MSSV */}
        <section className={styles.teamSection} aria-labelledby="team-heading">
          <div className={styles.sectionHeader}>
            <h2 id="team-heading" className={styles.sectionTitle}>
              Nhóm thực hiện
            </h2>
          </div>

          <div className={styles.membersGrid}>
            {TEAM_MEMBERS.map((member) => (
              <article key={member.studentId} className={styles.memberCard}>
                <span className={styles.memberOrder} aria-hidden="true">
                  {String(member.order).padStart(2, '0')}
                </span>
                <div className={styles.memberDetails}>
                  <h3 className={styles.memberName}>{member.fullName}</h3>
                  <p className={styles.memberMssv}>MSSV: {member.studentId}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
