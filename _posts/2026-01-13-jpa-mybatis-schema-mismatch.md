---
title: "JPA와 MyBatis의 차이: DB 스키마 불일치 처리 방식"
date: 2026-01-13 19:30:00 +0900
categories: [개발, 백엔드]
tags: [jpa, mybatis, database, troubleshooting]
description: MyBatis에서 발생하는 DB 스키마 불일치 에러와 JPA와의 차이점, 해결 방법을 정리합니다.
---

MyBatis를 사용하는 프로젝트에서 DB 스키마와 코드가 불일치하면서 런타임 에러가 발생했다. JPA를 주로 사용해왔던 입장에서 MyBatis의 동작 방식이 생각보다 달라서 당황했던 경험을 정리해본다.

---

## 문제 상황

멀티 테넌트 환경에서 동일한 코드로 여러 DB 스키마에 접근하는 구조였다. 한 스키마에서는 정상 동작하는데 다른 스키마에서만 에러가 발생했다.

```
ERROR 1054 (42S22): Unknown column 'path' in 'field list'
```

원인은 단순했다. `jsums` 스키마에는 `path` 컬럼이 있고, `ums_test` 스키마에는 없었다. JPA를 쓸 때는 이런 상황에서 유연하게 처리됐던 것 같은데, MyBatis는 바로 에러가 터졌다.

---

## JPA와 MyBatis의 차이점

두 ORM의 스키마 불일치 처리 방식을 비교해봤다.

### 컬럼명이 다른 경우

DB 컬럼명이 `note`인데 코드에서는 `memo`로 쓰고 있다고 가정해보자.

JPA에서는 `@Column` 어노테이션으로 간단하게 해결된다.

```java
@Entity
public class BlockWord {
    @Column(name = "note")
    private String memo;
}
```

MyBatis는 두 가지 방법이 있다.

첫 번째는 Model 필드명을 DB에 맞추는 방법이다. 가장 단순하고 권장되는 방식이다.

```java
public class BlockWord {
    private String note;  // memo에서 note로 변경
}
```

두 번째는 `resultMap`으로 명시적으로 매핑하는 방법이다.

```xml
<resultMap id="BlockWordMap" type="BlockWord">
    <result property="memo" column="note"/>
</resultMap>

<select id="selectList" resultMap="BlockWordMap">
    SELECT note FROM fdeny_word
</select>
```

참고로 MyBatis의 `mapUnderscoreToCamelCase` 옵션은 스네이크 케이스를 카멜 케이스로 변환해주는 기능이다. `user_name`을 `userName`으로 바꿔주지만, `memo`와 `note`처럼 완전히 다른 이름은 변환해주지 않는다.

### DB에만 컬럼이 있는 경우

DB에 `path` 컬럼이 있는데 Model에는 해당 필드가 없는 상황이다.

JPA든 MyBatis든 둘 다 문제없다. SELECT 절에 명시하지 않으면 그냥 무시된다.

### Model에만 필드가 있는 경우

이 경우가 문제다. Model에 `regId` 필드가 있는데 실제 DB에는 해당 컬럼이 없는 상황이다.

JPA는 `@Transient` 어노테이션으로 DB 매핑에서 제외할 수 있다.

```java
@Entity
public class BlockWord {
    @Transient
    private String regId;
}
```

MyBatis는 SELECT 절에 해당 컬럼을 포함하면 바로 에러가 발생한다.

```xml
<!-- Unknown column 'reg_id' 에러 발생 -->
<select id="selectList" resultType="BlockWord">
    SELECT no, user_id, reg_id FROM fdeny_word
</select>
```

해결 방법은 SELECT 절에서 해당 컬럼을 제거하거나, Model에서 필드 자체를 삭제하는 것이다.

---

## 해결 방법

멀티 테넌트 환경에서 스키마 차이가 발생했을 때 권장하는 방법은 모든 DB에 스키마를 동기화하는 것이다.

```sql
ALTER TABLE homepage ADD COLUMN path varchar(20);
```

스키마 동기화가 어려운 상황이라면 동적 쿼리로 우회할 수도 있다.

```xml
<select id="selectByNo" resultType="HomepageInfo">
    SELECT no, name, apikey
    <if test="_databaseId == 'jsums'">
        , path
    </if>
    FROM homepage
</select>
```

다만 이 방법은 쿼리가 복잡해지고 유지보수가 어려워지므로 임시방편으로만 사용하는 게 좋다.

---

## 핵심 차이점 정리

| 기능 | JPA | MyBatis |
|------|-----|---------|
| 컬럼명 매핑 | `@Column(name="...")` | `resultMap` 또는 필드명 변경 |
| DB에 없는 필드 | `@Transient` | SELECT 절에서 제외 필수 |
| 자동 스키마 동기화 | `ddl-auto` 옵션 | 지원 안함 (Flyway 등 별도 도구 필요) |
| 유연성 | 높음 | 낮음 (SQL 직접 작성) |

---

## 디버깅 팁

`Unknown column` 에러가 발생하면 다음 순서로 확인한다.

에러 메시지에서 문제되는 컬럼명을 파악한다. `DESCRIBE {테이블명}` 명령어로 실제 DB 구조를 확인한다. Model 필드명과 Mapper XML의 SELECT 절을 비교한다. 모든 환경(dev, test, prod)의 DB 스키마가 일치하는지 확인한다.

MyBatis 실행 쿼리를 로그로 확인하려면 다음 설정을 추가한다.

```yaml
logging:
  level:
    org.mybatis: DEBUG
```

---

## 정리

JPA에서 MyBatis로 넘어오면서 스키마 불일치에 대한 유연성이 낮다는 걸 체감했다. JPA는 어노테이션으로 대부분의 상황을 처리할 수 있지만, MyBatis는 SQL을 직접 작성하는 만큼 DB 구조와 코드가 정확히 일치해야 한다.

Flyway나 Liquibase 같은 마이그레이션 도구를 도입해서 모든 환경의 스키마를 동기화하는 게 가장 확실한 예방책이다. ERD 문서와 실제 DB 구조가 항상 일치하도록 관리하는 습관도 중요하다.
