FROM devopsartifact.jio.com/jpf-cwms__dev__dcr/openjdk:17
ENV TZ=Asia/Kolkata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
WORKDIR /app/jars
COPY /target/cwms_onboard-1.0.0.jar cwms_onboard-1.0.0.jar
WORKDIR /opt/workdir/
COPY sslcert/*.cer /opt/workdir/
ARG CERT1=cwms_emponboard.cer
RUN keytool -importcert -file $CERT1 -alias $CERT1 -cacerts -storepass changeit -noprompt
WORKDIR /opt/workdir/
COPY sslcert/*.cer /opt/workdir/
ARG CERT2=resbqa.cer
RUN keytool -importcert -file $CERT2 -alias $CERT2 -cacerts -storepass changeit -noprompt
#RUN cd /app && ls -lrth
CMD ["java", "-jar", "/app/jars/cwms_onboard-1.0.0.jar"]